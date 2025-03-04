
import NodeCache from "node-cache";
import redis, { RedisClientType } from 'redis';
import fs from 'fs';

const globalCache = new NodeCache();

class CacheService{

    redisClient : RedisClientType | undefined
    cacheExpiration = parseInt(process.env.CACHE_TIME_MS || "3600000", 10)

    constructor(){
        if(process.env.REDIS_URL){
            this.redisClient = redis.createClient({ url: process.env.REDIS_URL });
        }
    }


    async saveAllSwaggers(allSwaggerData : string) : Promise<void>{
        if(this.redisClient){
            await this.redisClient.set(this.getCacheKey(), allSwaggerData, { EX: this.cacheExpiration });
        }else{
            await globalCache.set(this.getCacheKey(), allSwaggerData, this.cacheExpiration)
        }
    }

    async getAllSwagger() : Promise<string | undefined>{
        if(this.redisClient){
            return (await this.redisClient.get(this.getCacheKey())) as string | undefined
        }else{
            await globalCache.get(this.getCacheKey())
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