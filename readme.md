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


## Environment variables
