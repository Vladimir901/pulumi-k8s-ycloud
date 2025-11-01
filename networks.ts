import * as pulumi from "@pulumi/pulumi";
import * as yandex from "@pulumi/yandex";

export const defaultVpcNetwork = new yandex.VpcNetwork("pulumi-first-vpc");

// Create subnets in different zones for high availability
export const subnetA = new yandex.VpcSubnet("k8s-subnet-a", {
    networkId: defaultVpcNetwork.id,
    zone: "ru-central1-a",
    v4CidrBlocks: ["10.1.0.0/24"],
    description: "Subnet in zone A",
});

export const subnetB = new yandex.VpcSubnet("k8s-subnet-b", {
    networkId: defaultVpcNetwork.id,
    zone: "ru-central1-b",
    v4CidrBlocks: ["10.2.0.0/24"],
    description: "Subnet in zone B",
});

export const subnetD = new yandex.VpcSubnet("k8s-subnet-d", {
    networkId: defaultVpcNetwork.id,
    zone: "ru-central1-d",
    v4CidrBlocks: ["10.3.0.0/24"],
    description: "Subnet in zone D",
});

// Create security group for the cluster
export const securityGroup = new yandex.VpcSecurityGroup("k8s-security-group", {
    networkId: defaultVpcNetwork.id,
    description: "Security group for Kubernetes cluster",
    ingresses: [
        {
            protocol: "TCP",
            port: 443,
            v4CidrBlocks: ["0.0.0.0/0"],
            description: "Allow HTTPS access to Kubernetes API",
        },
    ],
    egresses: [
        {
            protocol: "ANY",
            v4CidrBlocks: ["0.0.0.0/0"],
            description: "Allow all outbound traffic",
        },
    ],
});

// Create service account for the cluster control plane
export const clusterServiceAccount = new yandex.IamServiceAccount("k8s-cluster-sa", {
    description: "Service account for Kubernetes cluster control plane",
});

// Grant edit role to the cluster service account
export const clusterSaBinding = new yandex.ResourcemanagerFolderIamMember("k8s-cluster-sa-editor", {
    folderId: pulumi.output(yandex.getClientConfig()).folderId,
    role: "editor",
    member: pulumi.interpolate`serviceAccount:${clusterServiceAccount.id}`,
});

// Create service account for worker nodes
export const nodeServiceAccount = new yandex.IamServiceAccount("k8s-node-sa", {
    description: "Service account for Kubernetes worker nodes",
});

// Grant necessary roles to node service account
export const nodeSaBinding = new yandex.ResourcemanagerFolderIamMember("k8s-node-sa-puller", {
    folderId: pulumi.output(yandex.getClientConfig()).folderId,
    role: "container-registry.images.puller",
    member: pulumi.interpolate`serviceAccount:${nodeServiceAccount.id}`,
});

// Optional: Create KMS key for encryption at rest
export const kmsKey = new yandex.KmsSymmetricKey("k8s-kms-key", {
    description: "KMS key for Kubernetes secrets encryption",
    defaultAlgorithm: "AES_128",
    rotationPeriod: "8760h", // 1 year
});