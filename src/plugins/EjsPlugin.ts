import fastifyPlugin from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import path from 'path'
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import fastifyView from '@fastify/view';
import * as ejs from 'ejs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


export default fastifyPlugin(async (fastify: FastifyInstance) => {
        
    // Imposta EJS come motore di template
    fastify.register(fastifyView, {
      engine: {
        ejs: ejs
      },
      templates: path.join(__dirname, '../public')
    });
        
	},
);
