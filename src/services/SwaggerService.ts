import { fastifyApp } from "../index.js";
import CacheService from "./CacheService.js"
import KubernetesSwaggerDiscoveryService from "./KubernetesSwaggerDiscoveryService.js";


class SwaggerService{

    cacheService = new CacheService()
    discoveryService = new KubernetesSwaggerDiscoveryService();

    async get(){
        try{
            const swagger = await this.cacheService.getAllSwagger();
            if(swagger) return swagger;
            const newSwagger = await this.discoveryService.discovery();
            await this.cacheService.saveAllSwaggers(JSON.stringify(newSwagger));
            return newSwagger;
        }catch(err){
            fastifyApp.log.error(err)
        }
    }
}

export default SwaggerService 