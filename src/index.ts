import AutoLoad from '@fastify/autoload';
import Fastify from 'fastify';
import path from 'path';
import dotenv from 'dotenv'
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import KubernetesSwaggerDiscoveryService from "./services/KubernetesSwaggerDiscoveryService.js";
import NodeCache from 'node-cache';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const inMemoryCache = new NodeCache({ stdTTL: 180, checkperiod: 60 }); // TTL di 3 minuti

export const fastifyApp = Fastify({
    logger: true,
  });
  
  export async function build() {
    const startPlugins = performance.now();
    
    await fastifyApp.register(AutoLoad, {
      dir: path.join(__dirname, 'plugins'),
    });
    fastifyApp.log.info(`Plugins ${(performance.now() - startPlugins).toFixed(2)} ms`);
  
    const startControllers = performance.now();
    await fastifyApp.register(AutoLoad, {
      dir: path.join(__dirname, 'controller'),
    });
    fastifyApp.log.info(`Controllers ${(performance.now() - startControllers).toFixed(2)} ms`);
  
    return fastifyApp;
  }

  const start = async () => {
    dotenv.config();
  
    let fastify;
  
    const start = performance.now();
    try {
      fastify = await build();
    } catch (e) {
      console.error('Error occured while building fastify');
      console.error(e);
      return;
    }
  
    fastify.log.info(`Successfully built fastify instance in ${(performance.now() - start).toFixed(2)} ms`);
  
    await fastify.listen({
      host: '0.0.0.0',
      port: parseInt(process.env.HTTP_PORT || "3000", 10),
    });

    new KubernetesSwaggerDiscoveryService().discovery();
  };
  
  start();