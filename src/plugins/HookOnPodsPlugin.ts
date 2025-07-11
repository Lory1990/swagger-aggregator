import * as k8s from '@kubernetes/client-node'
import fastifyPlugin from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import KubernetesSwaggerDiscoveryService from '../services/KubernetesSwaggerDiscoveryService.js';
import { fastifyApp, inMemoryCache } from '../index.js';

const watchCallback = (startDate: Date, type : string, pod : any) => {
        if(Date.now() - startDate.getTime() < 30000) return
        if (!pod || !pod.metadata || !pod.status) return

          const owner = pod.metadata.ownerReferences?.find((o : any) => o.kind === "ReplicaSet");
          if (!owner) return; // Il pod non ha un owner di tipo ReplicaSet
    
          const replicaSetName = owner.name;
    
          // Recupera il deployment dal nome del ReplicaSet
          const deploymentName = replicaSetName.replace(/-\w{9,10}$/, ""); // Rimuove l'ID univoco del ReplicaSet

          if(['Pending', 'Failed'].includes(pod.status.phase)) return;
    
          const cacheKey = `deployment:${pod.status.phase}:${deploymentName}`;
          if (inMemoryCache.get(cacheKey)) {
              fastifyApp.log.info(`Status changed ignored: ${pod.status.phase} for ${deploymentName}, already registered`);
            return;
          }
    
          inMemoryCache.set(cacheKey, true);
    
          fastifyApp.log.info(`Pod ${pod.metadata.name} status changed: ${pod.status.phase} for deployment ${deploymentName}`);
          
          new KubernetesSwaggerDiscoveryService().discovery();
}

export default fastifyPlugin(async (fastify: FastifyInstance) => {
        
        const kc = new k8s.KubeConfig();
        kc.loadFromDefault(); 
        
        const watch = new k8s.Watch(kc);
        const namespaces = process.env.NAMESPACES ? process.env.NAMESPACES.split(",") : undefined        
        const date = new Date();
        fastifyApp.log.info("Start watching pods");
        if(namespaces){
                for(const namespace of namespaces){
                        watch.watch(`/api/v1/namespaces/${namespace}/pods`, { watch: true, resourceVersion: "0" },
                                (type, pod) => watchCallback(date, type, pod),
                                (err) => fastify.log.error(err)
                        );
        }
        }else{
                watch.watch("/api/v1/pods", { watch: true, resourceVersion: "0" },
                        (type, pod) => watchCallback(date, type, pod),
                        (err) => fastify.log.error(err)
                );
        }
});
