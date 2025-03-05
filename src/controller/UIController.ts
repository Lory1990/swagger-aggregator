import { FastifyInstance } from 'fastify';

const UIController = async (fastify: FastifyInstance) => {


    fastify.get('/', async (req, res) => {
        return res.view('redoc', { prefix: process.env.SUBPATH || "" }); 
    });

    fastify.get('/swagger', async (req, res) => {
        return res.view('swagger', { prefix: process.env.SUBPATH || "" }); 
    });
}


export default UIController