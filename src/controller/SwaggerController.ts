import { FastifyInstance } from 'fastify';
import SwaggerService from '../services/SwaggerService.js';
import CacheService from '../services/CacheService.js';

const SwaggerController = async (fastify: FastifyInstance) => {

    const swaggerService = new SwaggerService()

    fastify.get('/documentation/json', async (req, res) => {
        res.send(await swaggerService.get());
    });

    fastify.delete('/documentation/json', async (req, res) => {
        await new CacheService().deleteAllSwagger();
        res.send();
    });
}


export default SwaggerController