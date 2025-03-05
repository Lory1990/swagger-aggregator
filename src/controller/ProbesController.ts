import { FastifyInstance } from 'fastify';

const ProbesController = async (fastify: FastifyInstance) => {

    fastify.get('/-/check-up', async (req, res) => {
        res.send();
    });

    fastify.get('/-/ready', async (req, res) => {
        res.send();
    });

    fastify.get('/-/healthz', async (req, res) => {
        res.send();
    });
}


export default ProbesController
