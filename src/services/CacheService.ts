
import NodeCache from "node-cache";
import redis, { RedisClientType } from 'redis';
import { fastifyApp, inMemoryCache } from "../index.js";

class CacheService{

    redisClient : RedisClientType | undefined
    cacheExpiration = parseInt(process.env.CACHE_TIME_MS || "3600000", 10)

    constructor(){
        if(process.env.REDIS_URL){
            this.redisClient = redis.createClient({ url: process.env.REDIS_URL });
        }
    }


    async saveAllSwaggers(allSwaggerData : string) : Promise<void>{
        try{
            if(this.redisClient){
                await this.redisClient.set(this.getCacheKey(), allSwaggerData, { EX: this.cacheExpiration });
            }else{
                await inMemoryCache.set(this.getCacheKey(), allSwaggerData, this.cacheExpiration)
            }
        }catch(err){
            fastifyApp.log.error(err)
        }
    }

    async getAllSwagger() : Promise<string | undefined>{
        try{
            if(this.redisClient){
                return (await this.redisClient.get(this.getCacheKey())) as string | undefined
            }else{
                return await inMemoryCache.get(this.getCacheKey())
            }
        }catch(err){
            fastifyApp.log.error(err)
        }
    }

    async deleteAllSwagger(){
        try{
            if(this.redisClient){
                await this.redisClient.del(this.getCacheKey())
            }else{
                await inMemoryCache.del(this.getCacheKey())
            }
        }catch(err){
            fastifyApp.log.error(err)
        }
    }

    getCacheKey(){
        if(process.env.CACHE_KEY_PREFIX){
            return process.env.CACHE_KEY_PREFIX + "all_swagger_data";
        }
        return "all_swagger_data"
    }

}



export default CacheService