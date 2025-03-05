import * as k8s from '@kubernetes/client-node'
import fastifyPlugin from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import KubernetesSwaggerDiscoveryService from '../services/KubernetesSwaggerDiscoveryService.js';



export default fastifyPlugin(async (fastify: FastifyInstance) => {
        
        const kc = new k8s.KubeConfig();
        kc.loadFromDefault(); 
        
        const watch = new k8s.Watch(kc);

        // watch.watch(
        //     '/api/v1/pods',
        //     { watch: true },
        //     (type, pod) => {
        //       if (pod && pod.metadata && pod.status) {
        //         //console.log(`[${type}] Pod: ${pod.metadata.name} - Status: ${pod.status.phase}`);
        //         // Esegui una logica personalizzata in base allo stato del pod
        //         if (type === 'MODIFIED' || type === "ADDED" || type === "DELETED") {
        //           console.log(`Pod ${pod.metadata.name} cambiato di stato: ${pod.status.phase}`);
        //           new KubernetesSwaggerDiscoveryService().discovery();
        //         }
        //       }
        //     },
        //     (err) => {
        //     fastify.log.error(err)
        //     }
        //   );
    
        
	},
);
