# Swagger Aggregator

Swagger Aggregator is a service that performs auto-discovery of Ingress resources in a Kubernetes cluster. It retrieves the associated services and pods, checks if at least one pod is active, and then queries a specific service on one or more predefined paths. The service aggregates all the Swagger definitions found using the paths defined in the Ingress resources.

## Features

* Auto-discovery of Ingress resources: Automatically detects all Ingress resources within the cluster.

* Service and pod validation: Ensures that at least one pod is active before querying the service.

* Dynamic Swagger aggregation: Collects and merges Swagger definitions exposed by the discovered services.

* Kubernetes-native deployment: Designed to run seamlessly within a Kubernetes environment.

## How it works

Once deployed, Swagger Aggregator will automatically:

1. Scan the cluster for Ingress resources.

1. Extract the related services.

1. Validate that at least one pod is active for each service.

1. Query the service on the specified paths to get the swagger API.

1. Aggregate the Swagger definitions and expose them.

## Deployment
Simple use the helm chart in the `/helm` folder


## Environment variables  
| Variable | Description |  
|---------------------|-------------|  
| `NAMESPACES` | Specifies the Kubernetes namespaces to monitor, if not set it will monitor all cluster |  
| `EXTERNAL_ACCESS` | Base URL to discover documentation, if not set if uses the internal k8s DNS resolution |  
| `DOCUMENTATION_URLS` | Paths to look for Swagger documentation separated by comma |  
| `HIDE_PATHS` | Paths to hide in the final Swagger aggregation separated by comma |  
| `PATHS_TO_NOT_DISCOVER` | Paths to exclude during the discovery phase |  
| `CACHE_TIME_MS` | Cache time in milliseconds |  
| `CACHE_KEY_PREFIX` | Prefix for cache keys |  
| `REDIS_URL` | Redis server connection URL (optional) |  
| `REDIS_USERNAME` | Username for Redis authentication (optional) |  
| `REDIS_PASSWORD` | Password for Redis authentication (optional) |  
| `SUBPATH` | Base subpath for the application |  
