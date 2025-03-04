import fastifyPlugin from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import fastifyStatic from '@fastify/static';
import { join } from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);



export default fastifyPlugin(async (fastify: FastifyInstance) => {
        //console.log("Root is", join(__dirname, '../public'));
        
        fastify.register(fastifyStatic, {
            root: join(__dirname, '../public'),
            prefix: '/', // Accesso via /docs/
        });
	},
);
