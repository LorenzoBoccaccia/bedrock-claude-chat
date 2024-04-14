import { Construct } from "constructs";
import * as rds from "aws-cdk-lib/aws-rds";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { CustomResource, Duration } from "aws-cdk-lib";

import * as lambda from "aws-cdk-lib/aws-lambda";

import * as events from "aws-cdk-lib/aws-events";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { CronSchedule } from "../utils/cron-schedule";
import { CfnSchedule } from "aws-cdk-lib/aws-scheduler";
import {
  Effect,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from "aws-cdk-lib/aws-iam";

const DB_NAME = "postgres";

export interface VectorStoreProps {
  readonly vpc: ec2.IVpc;
  readonly rdsSchedule: CronSchedule;
}

export class VectorStore extends Construct {
  readonly securityGroup: ec2.ISecurityGroup;
  readonly instance: rds.IDatabaseInstance; // Changed from cluster to instance
  readonly secret: secretsmanager.ISecret;
  constructor(scope: Construct, id: string, props: VectorStoreProps) {
    super(scope, id);

    const sg = new ec2.SecurityGroup(this, "InstanceSecurityGroup", { // Changed ClusterSecurityGroup to InstanceSecurityGroup
      vpc: props.vpc,
    });
    const instance = new rds.DatabaseInstance(this, "Instance", { // Changed from DatabaseCluster to DatabaseInstance
      engine: rds.DatabaseInstanceEngine.postgres({ // Changed to postgres engine
        version: rds.PostgresEngineVersion.VER_16_1, // Specify the version you want, VER_13_4 as an example
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MICRO), // Specify t4g.micro instance type
      vpc: props.vpc,
      securityGroups: [sg],
      allocatedStorage: 20, // Specify allocated storage in GB
      databaseName: DB_NAME,
    });

    const dbInstanceIdentifier = instance.instanceIdentifier; // Changed from dbClusterIdentifier to dbInstanceIdentifier

    // The rest of your code remains the same, just ensure to replace any cluster-specific code with instance equivalents
    // For example, cluster.clusterEndpoint should be changed to instance.dbInstanceEndpointAddress
    // and cluster.secret to instance.secret, etc.

    this.securityGroup = sg;
    this.instance = instance; // Changed from this.cluster to this.instance
    this.secret = instance.secret!; // Adjusted for the instance
  }

  allowFrom(other: ec2.IConnectable) {
    this.securityGroup.connections.allowFrom(
      other,
      ec2.Port.tcp(this.instance.instanceEndpoint.port) // Adjusted for the instance
    );
  }
}