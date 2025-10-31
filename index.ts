import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";
import * as yandex from "@pulumi/yandex";

const defaultVpcNetwork = new yandex.VpcNetwork("pulumi-first-vpc");


