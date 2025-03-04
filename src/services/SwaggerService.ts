import CacheService from "./CacheService.js"
import KubernetesSwaggerDiscoveryService from "./KubernetesSwaggerDiscoveryService.js";


class SwaggerService{

    cacheService = new CacheService()
    discoveryService = new KubernetesSwaggerDiscoveryService();

    async get(){
        const swagger = await this.cacheService.getAllSwagger();
        if(swagger) return swagger;
        const newSwagger = await this.discoveryService.discovery();
        await this.cacheService.saveAllSwaggers(JSON.stringify(newSwagger));
        return newSwagger;
    }
}

export default SwaggerService 