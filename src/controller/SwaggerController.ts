import { FastifyInstance } from 'fastify';
import SwaggerService from '../services/SwaggerService.js';

const SwaggerController = async (fastify: FastifyInstance) => {

    const swaggerService = new SwaggerService()

    fastify.get('/documentation/json', async (req, res) => {
        res.send(await swaggerService.get());
    });
}


export default SwaggerController