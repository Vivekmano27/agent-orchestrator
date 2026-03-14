---
name: aws-deployment
description: Deploy applications to AWS — EC2, ECS, Lambda, S3, CloudFront, RDS, ElastiCache, IAM, VPC, and CDK/Terraform infrastructure. Use when deploying to AWS, configuring cloud resources, setting up infrastructure, or the user mentions any AWS service.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# AWS Deployment Skill

Deploy and manage applications on Amazon Web Services.

## Common Architectures

### Serverless (Lambda + API Gateway)
```
Route53 → CloudFront → API Gateway → Lambda → RDS/DynamoDB
                    → S3 (static assets)
```

### Container (ECS Fargate)
```
Route53 → ALB → ECS Fargate → RDS PostgreSQL
                            → ElastiCache Redis
                            → S3 (uploads)
```

### CDK Template (TypeScript)
```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as rds from 'aws-cdk-lib/aws-rds';

export class AppStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string) {
    super(scope, id);
    
    const vpc = new ec2.Vpc(this, 'VPC', { maxAzs: 2 });
    
    const db = new rds.DatabaseInstance(this, 'DB', {
      engine: rds.DatabaseInstanceEngine.postgres({ version: rds.PostgresEngineVersion.VER_16 }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      vpc,
      databaseName: 'app',
    });
    
    const cluster = new ecs.Cluster(this, 'Cluster', { vpc });
    // ... ECS service, ALB, etc.
  }
}
```

## Cost Optimization
- Use Spot instances for non-critical workloads
- Right-size instances based on metrics
- Use Reserved Instances for predictable workloads
- S3 lifecycle policies for old data
- CloudFront caching to reduce origin requests
