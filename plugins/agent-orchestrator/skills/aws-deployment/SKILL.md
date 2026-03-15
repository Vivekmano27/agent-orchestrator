---
name: aws-deployment
description: Deploy applications to AWS, GCP, or Azure — covers Lambda, ECS, Cloud Run, GKE, Azure Container Apps, AKS, CDK/Terraform, and PaaS platforms (Vercel, Railway, Render). Use when deploying to any cloud provider, configuring cloud resources, or setting up infrastructure.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# Cloud Deployment Skill

Deploy and manage applications on AWS, GCP, Azure, and PaaS platforms.

## AWS Deployment

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
import { Vpc, InstanceType, InstanceClass, InstanceSize } from 'aws-cdk-lib/aws-ec2';
import { Cluster } from 'aws-cdk-lib/aws-ecs';
import { DatabaseInstance, DatabaseInstanceEngine, PostgresEngineVersion } from 'aws-cdk-lib/aws-rds';

export class AppStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string) {
    super(scope, id);
    const vpc = new Vpc(this, 'VPC', { maxAzs: 2 });
    const db = new DatabaseInstance(this, 'DB', {
      engine: DatabaseInstanceEngine.postgres({ version: PostgresEngineVersion.VER_16 }),
      instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.MICRO),
      vpc, databaseName: 'app',
    });
    const cluster = new Cluster(this, 'Cluster', { vpc });
  }
}
```

### Cost Optimization
- Use Spot instances for non-critical workloads
- Right-size instances based on metrics
- Use Reserved Instances for predictable workloads
- S3 lifecycle policies for old data
- CloudFront caching to reduce origin requests

## GCP Deployment

### Serverless (Cloud Run)
```
Cloud DNS → Cloud Load Balancing → Cloud Run → Cloud SQL (PostgreSQL)
                                             → Memorystore (Redis)
                                             → Cloud Storage (uploads)
```

### Kubernetes (GKE Autopilot)
```
Cloud DNS → Cloud Load Balancing → GKE Autopilot → Cloud SQL
                                                  → Memorystore
                                                  → Cloud Storage
```

### Cloud Run Deployment (gcloud CLI)
```bash
gcloud builds submit --tag gcr.io/$PROJECT_ID/app
gcloud run deploy app --image gcr.io/$PROJECT_ID/app \
  --platform managed --region us-central1 --allow-unauthenticated \
  --add-cloudsql-instances $PROJECT_ID:us-central1:app-db \
  --min-instances 1 --max-instances 10 --memory 512Mi --cpu 1
```

### GKE Quick Setup
```bash
gcloud container clusters create-auto app-cluster --region us-central1
kubectl apply -f k8s/
```

### Cost Optimization
- Use Cloud Run for bursty workloads (scale to zero)
- GKE Autopilot over Standard to avoid node over-provisioning
- Committed use discounts for steady-state workloads
- Cloud CDN in front of Cloud Storage

## Azure Deployment

### Container Apps
```
Azure Front Door → Container Apps Environment → Container App → Azure Database for PostgreSQL
                                                              → Azure Cache for Redis
                                                              → Blob Storage (uploads)
```

### Kubernetes (AKS)
```
Azure Front Door → AKS Cluster → Azure Database for PostgreSQL
                                → Azure Cache for Redis
                                → Blob Storage
```

### Container Apps Deployment (az CLI)
```bash
az containerapp env create --name app-env --resource-group app-rg --location eastus
az containerapp create --name app --resource-group app-rg --environment app-env \
  --image app.azurecr.io/app:latest --target-port 3000 --ingress external \
  --min-replicas 1 --max-replicas 10 --cpu 0.5 --memory 1.0Gi
```

### AKS Quick Setup
```bash
az aks create --resource-group app-rg --name app-cluster \
  --node-count 2 --enable-managed-identity --generate-ssh-keys
az aks get-credentials --resource-group app-rg --name app-cluster
kubectl apply -f k8s/
```

### Cost Optimization
- Use Container Apps for event-driven workloads (scale to zero)
- Azure Spot VMs for fault-tolerant workloads
- Reserved Instances for predictable compute
- Azure CDN for static asset caching

## Vercel / Railway / Render (PaaS)

### Vercel (Next.js / Static)
```jsonc
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "regions": ["iad1"],
  "env": { "DATABASE_URL": "@database-url" }
}
```

### Railway
```toml
# railway.toml
[build]
builder = "dockerfile"
dockerfilePath = "Dockerfile"

[deploy]
startCommand = "npm start"
healthcheckPath = "/health"
```

### Render
```yaml
# render.yaml
services:
  - type: web
    name: app
    runtime: docker
    plan: starter
    healthCheckPath: /health
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: app-db
          property: connectionString
databases:
  - name: app-db
    plan: starter
```
