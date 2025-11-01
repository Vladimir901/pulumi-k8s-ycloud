import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";
import * as yandex from "@pulumi/yandex";
import { clusterSaBinding, clusterServiceAccount, defaultVpcNetwork, kmsKey, nodeSaBinding, nodeServiceAccount, securityGroup, subnetA, subnetB, subnetD } from './networks';

// Create the Kubernetes cluster (Regional for HA)
const k8sCluster = new yandex.KubernetesCluster("production-cluster", {
    description: "Production Kubernetes cluster with high availability",
    networkId: defaultVpcNetwork.id,
    serviceAccountId: clusterServiceAccount.id,
    nodeServiceAccountId: nodeServiceAccount.id,
    
    // Release channel: RAPID, REGULAR, or STABLE
    releaseChannel: "STABLE",
    
    // Network policy provider for pod security
    networkPolicyProvider: "CALICO",
    
    // IP ranges for pods and services
    clusterIpv4Range: "10.112.0.0/16",
    serviceIpv4Range: "10.96.0.0/16",
    
    // Optional: KMS encryption for secrets
    kmsProvider: {
        keyId: kmsKey.id,
    },
    
    // Labels for organization
    labels: {
        environment: "production",
        team: "platform",
        managed_by: "pulumi",
    },
    
    // Master (control plane) configuration
    master: {
        version: "1.32", // Specify Kubernetes version
        publicIp: true,   // Assign public IP for API access
        
        // Regional deployment across 3 zones for HA
        regional: {
            region: "ru-central1",
            locations: [
                {
                    zone: subnetA.zone,
                    subnetId: subnetA.id,
                },
                {
                    zone: subnetB.zone,
                    subnetId: subnetB.id,
                },
                {
                    zone: subnetD.zone,
                    subnetId: subnetD.id,
                },
            ],
        },
        
        // Security group
        securityGroupIds: [securityGroup.id],
        
        // Maintenance policy for auto-upgrades
        maintenancePolicy: {
            autoUpgrade: true,
            maintenanceWindows: [
                {
                    day: "monday",
                    startTime: "05:00",
                    duration: "3h",
                },
                {
                    day: "thursday",
                    startTime: "05:00",
                    duration: "3h",
                },
            ],
        },
    },
}, { dependsOn: [clusterSaBinding, nodeSaBinding] });