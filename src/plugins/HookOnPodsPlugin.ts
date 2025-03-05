import * as k8s from '@kubernetes/client-node'
import fastifyPlugin from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import KubernetesSwaggerDiscoveryService from '../services/KubernetesSwaggerDiscoveryService.js';
import { fastifyApp, inMemoryCache } from '../index.js';


export default fastifyPlugin(async (fastify: FastifyInstance) => {
        
        const kc = new k8s.KubeConfig();
        kc.loadFromDefault(); 
        
        const watch = new k8s.Watch(kc);
        const namespaces = process.env.NAMESPACES ? process.env.NAMESPACES.split(",") : undefined

        const date = new Date();
        fastifyApp.log.info("Start watching pods");
        watch.watch("/api/v1/pods", { watch: true, resourceVersion: "0" },
                (type, pod) => {
                  if(Date.now() - date.getTime() < 30000) return
                  if (!pod || !pod.metadata || !pod.status) return
                  if(namespaces && !namespaces.includes(pod.metadata.namespace)) return

                    const owner = pod.metadata.ownerReferences?.find((o : any) => o.kind === "ReplicaSet");
                    if (!owner) return; // Il pod non ha un owner di tipo ReplicaSet
              
                    const replicaSetName = owner.name;
              
                    // Recupera il deployment dal nome del ReplicaSet
                    const deploymentName = replicaSetName.replace(/-\w{9,10}$/, ""); // Rimuove l'ID univoco del ReplicaSet

                    if(['Pending', 'Failed'].includes(pod.status.phase)) return;
              
                    const cacheKey = `deployment:${deploymentName}`;
                    if (inMemoryCache.get(cacheKey)) {
                        fastifyApp.log.info(`Ignorato cambiato di stato: ${pod.status.phase} per ${deploymentName}, già registrato recentemente`);
                      return;
                    }
              
                    inMemoryCache.set(cacheKey, true);
              
                    fastifyApp.log.info(`Pod ${pod.metadata.name} cambiato di stato: ${pod.status.phase} per deployment ${deploymentName}`);
                    
                    new KubernetesSwaggerDiscoveryService().discovery();
                },
                (err) => {
                  fastify.log.error(err);
                }
        );
});
