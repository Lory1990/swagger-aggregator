import * as k8s from '@kubernetes/client-node'
import axios, { AxiosError } from "axios";
import CacheService from './CacheService.js';
import { fastifyApp } from '../index.js';
import fs from 'fs-extra';
import * as path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class KubernetesSwaggerDiscoveryService{

    cacheService = new CacheService()
    kc = new k8s.KubeConfig();
    k8sApiCore : k8s.CoreV1Api
    k8sApiNetworking : k8s.NetworkingV1Api

    constructor(){
        this.kc.loadFromDefault();
        this.k8sApiCore = this.kc.makeApiClient(k8s.CoreV1Api);
        this.k8sApiNetworking = this.kc.makeApiClient(k8s.NetworkingV1Api);
    }


    async discovery() : Promise<any>{
        fastifyApp.log.info("Starting discovery service");
        try {
            let ingresses : k8s.V1Ingress[]  = []
            if(process.env.NAMESPACES){
                for(const namespace of process.env.NAMESPACES.split(",")){
                    const singleIngress = await this.k8sApiNetworking.listNamespacedIngress({ namespace });    
                    ingresses = [...ingresses, ...singleIngress.items]
                }
            }else{
                ingresses = (await this.k8sApiNetworking.listIngressForAllNamespaces()).items;
            }

            fastifyApp.log.info(`Found ${ingresses.length} ingresses`);
            const pathsToNotDiscover = process.env.PATHS_TO_NOT_DISCOVER ? process.env.PATHS_TO_NOT_DISCOVER.split(",") : []

            let allSwaggers : any[] = []
            for (const ingress of ingresses) {
                if (!ingress.spec?.rules) continue;
            
                for (const rule of ingress.spec.rules) {
                    if (!rule.http?.paths) continue;
            
                    for (const path of rule.http.paths) {
                        if(path.path && pathsToNotDiscover.includes(path.path)) continue
                        try{
                            const swagger = await this.getSwagger(ingress, path)
                            if(!swagger) {
                                fastifyApp.log.info("Cannot find swagger definitions for " + path)
                                continue
                            }
                            allSwaggers = [...allSwaggers, ...swagger]
                        }catch(err){
                            fastifyApp.log.error(err)
                        }
                    }
                }
            }

            const configFromPropsConfiguration = await this.getConfigurationFromProps();
            const finalSwagger = {
                ...configFromPropsConfiguration,
                paths: {},
                components: {
                    schemas: {},
                    securitySchemes: {
                        ...(configFromPropsConfiguration?.components?.securitySchemes || {})
                    }
                }
            }
            fastifyApp.log.debug("Starting swagger " + JSON.stringify(finalSwagger))
            for(const swagger of allSwaggers){
                //Working on paths
                const prefix = swagger.prefix
                const pathToHide : string[] | undefined = process.env.HIDE_PATHS ? process.env.HIDE_PATHS.split(",") : undefined
                const realPaths : Record<string, unknown> = {}
                for(const path of Object.keys(swagger.paths)){
                    if(pathToHide && pathToHide.includes(path)) continue
                    realPaths[prefix + path] = swagger.paths[path]
                }
                if(realPaths){
                    finalSwagger.paths = {...finalSwagger.paths, ...realPaths}
                }
                if(swagger?.components?.schemas){
                    finalSwagger.components.schemas = {...finalSwagger.components.schemas, ...swagger.components.schemas}
                }
            }
            
            fastifyApp.log.info("Discovery finished, saving swaggger with " + Object.keys(finalSwagger.components.schemas).length + " schemas and " + Object.keys(finalSwagger.paths).length + " paths")
            this.cacheService.saveAllSwaggers(JSON.stringify(finalSwagger))
            return finalSwagger;
        } catch (err) {
            fastifyApp.log.error(err)
        }
    }

    existsOnePodRunning(pods?: k8s.V1Pod[]) : boolean{
        if(!pods || pods.length === 0 ) return false;

        for(const pod in pods){
            if(pods[pod].status?.phase === "Running") return true;
        }
        return false;
    }
    async getSwagger(ingress : k8s.V1Ingress, path : k8s.V1HTTPIngressPath){
        const service = path.backend.service?.name
        if(!service) return
        const namespace = ingress?.metadata?.namespace || "default"
        const realPath = path.path
        fastifyApp.log.info("Working on namespace " + namespace + " and path " + realPath)
        if(path.pathType == "Prefix"){
            const associatedService = await this.k8sApiCore.readNamespacedService({ name: service, namespace  });
            
            const selector = associatedService.spec?.selector;
            
            if (!selector) throw new Error(`Service ${service} has no selector`);

            const labelSelector = Object.entries(selector)
                .map(([key, value]) => `${key}=${value}`)
                .join(",");
            
            fastifyApp.log.debug(`Looking for pods for service ${service} in namespace ${namespace} with selector ${labelSelector}`);
            const pods = await this.k8sApiCore.listNamespacedPod({ namespace, labelSelector}  );

            fastifyApp.log.debug(`Found ${pods.items.length} pods for service ${service} in namespace ${namespace}`);
            if(!this.existsOnePodRunning(pods.items)) {
                fastifyApp.log.debug(`It seems no one is running`);
                return;
            }

            const swaggerOut = []
            const documentationUrls : string[] = (process.env.DOCUMENTATION_URLS || "/documentation/json").split(",") 
            //Ok i have a single pod so i can get the swagger
            for(const port of associatedService.spec?.ports || []){
                for(const documentationUrl of documentationUrls){
                    let url = `http://${associatedService.metadata?.name}:${port.port}`
                    if(process.env.EXTERNAL_ACCESS){
                        url = `${process.env.EXTERNAL_ACCESS}${realPath}`
                    }
                    url += documentationUrl
                    try{
                        const result = await axios.get(url)
                        const swagger = result.data
                        swagger.prefix = realPath
                        swaggerOut.push(swagger)
                    }catch(err){
                        if(err instanceof AxiosError){
                            if(err.status == 404){
                                fastifyApp.log.error("Swagger not found at " + url)
                            }else if(err.status == 403){
                                fastifyApp.log.error("Swagger forbidden access at " + url)
                            }else if(err.status == 401){
                                fastifyApp.log.error("Swagger unauthorized access at " + url)
                            }else{
                                fastifyApp.log.error("Swagger error at " + url + " with status: " + err.status, err)
                            }
                        }else{
                            fastifyApp.log.error("Swagger error at " + url, err)
                        }
                    }
                }
            }

            return swaggerOut;
        }else{
            fastifyApp.log.info("Path type not supported " + path.pathType)
            throw new Error("Path type not supported " + path.pathType)
        }

    }

    async getConfigurationFromProps(){
        const configPath = path.join(__dirname, '../openapi-configuration.json');
        try {
            const data = fs.readFileSync(configPath, 'utf8');
            return JSON.parse(data);
        } catch (err) {
            if (err instanceof Error) {
                fastifyApp.log.error(`Failed to load openapi-configuration.json: ${err.message}`);
            } else {
                fastifyApp.log.error(`Failed to load openapi-configuration.json: ${String(err)}`);
            }
            return {
                openapi: '3.0.1',
                info: { title: 'OpenAPI definition', version: 'v0' },
                servers: [],
            };
        }
    }
}

export default KubernetesSwaggerDiscoveryService