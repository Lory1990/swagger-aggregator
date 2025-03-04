import * as k8s from '@kubernetes/client-node'
import axios from "axios";
import CacheService from './CacheService.js';

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
        console.log("Start discovery service");
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
            console.log("== Ingresses ==")
            console.log(ingresses.map((ingress : any) => ingress.metadata.name));
            console.log("================")

            let allSwaggers : any[] = []
            for (const ingress of ingresses) {
                if (!ingress.spec?.rules) continue;
            
                for (const rule of ingress.spec.rules) {
                    if (!rule.http?.paths) continue;
            
                    for (const path of rule.http.paths) {
                        try{
                            const swagger = await this.getSwagger(ingress, path)
                            if(!swagger) continue
                            allSwaggers = [...allSwaggers, ...swagger]
                        }catch(err){
                            console.log("Error", err)
                        }
                    }
                }
            }

            const finalSwagger = {
                openapi: '3.0.1',
                info: { title: 'OpenAPI definition', version: 'v0' },
                servers: [],
                paths: {},
                components: {
                    schemas: {}
                }
            }
            for(const swagger of allSwaggers){
                //Working on paths
                const prefix = swagger.prefix
                const pathToHide : string[] | undefined = process.env.HIDE_PATHS ? process.env.HIDE_PATHS.split(",") : undefined
                const realPaths : Record<string, unknown> = {}
                for(const path of Object.keys(swagger.paths)){
                    if(pathToHide && pathToHide.includes(path)) continue
                    realPaths[prefix + path] = swagger.paths[path]
                }
                finalSwagger.paths = {...finalSwagger.paths, ...realPaths}
                finalSwagger.components.schemas = {...finalSwagger.components.schemas, ...swagger.components.schemas}
            }
            
            console.log("Saving all swaggers", finalSwagger)
            this.cacheService.saveAllSwaggers(JSON.stringify(finalSwagger))
            return finalSwagger;
        } catch (err) {
            console.error('Error:', err);
        }
    }


    async getSwagger(ingress : k8s.V1Ingress, path : k8s.V1HTTPIngressPath){
        const service = path.backend.service?.name
        if(!service) return
        const namespace = ingress?.metadata?.namespace || "default"
        const realPath = path.path
        console.log("Working on namespace " + namespace + " and path " + realPath)
        if(path.pathType == "Prefix"){
            const associatedService = await this.k8sApiCore.readNamespacedService({ name: service, namespace  });
            
            const selector = associatedService.spec?.selector;
            
            if (!selector) throw new Error(`Service ${service} has no selector`);

            const labelSelector = Object.entries(selector)
                .map(([key, value]) => `${key}=${value}`)
                .join(",");
            
            console.log("Selector", labelSelector, "and namespace", namespace)  
            const pods = await this.k8sApiCore.listNamespacedPod({ namespace, labelSelector}  );

            console.log("Pods associati:", pods.items.map(pod => pod.metadata?.name));
            if(pods.items.length == 0) return;

            const swaggerOut = []
            //Ok i have a single pod so i can get the swagger
            for(const port of associatedService.spec?.ports || []){
                let url = `http://${associatedService.metadata?.name}:${port}/documentation/json`
                if(process.env.EXTERNAL_ACCESS){
                    url = `${process.env.EXTERNAL_ACCESS}${realPath}/documentation/json`
                }
                try{
                    const result = await axios.get(url)
                    const swagger = result.data
                    swagger.prefix = realPath
                    //console.log("Swagger", swagger)
                    swaggerOut.push(swagger)
                }catch(err){
                    
                    console.log("Error", err)
                }
            }

            return swaggerOut;
        }else{
            console.log("Path type not supported " + path.pathType)
            throw new Error("Path type not supported " + path.pathType)
        }

    }
}

export default KubernetesSwaggerDiscoveryService