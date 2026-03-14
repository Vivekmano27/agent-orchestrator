---
name: k8s-skill
description: Generate Kubernetes manifests — deployments, services, ingress, HPA, ConfigMaps, secrets, and Helm charts. Use when the user mentions "Kubernetes", "K8s", "Helm", "deployment manifest", or needs to deploy to a Kubernetes cluster.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# Kubernetes Skill

Production-grade Kubernetes manifests and Helm charts.

## Deployment Template
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app
  labels: { app: app }
spec:
  replicas: 3
  selector:
    matchLabels: { app: app }
  template:
    metadata:
      labels: { app: app }
    spec:
      containers:
        - name: app
          image: app:latest
          ports: [{ containerPort: 3000 }]
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef: { name: app-secrets, key: database-url }
          resources:
            requests: { cpu: 100m, memory: 128Mi }
            limits: { cpu: 500m, memory: 512Mi }
          livenessProbe:
            httpGet: { path: /health, port: 3000 }
            initialDelaySeconds: 10
          readinessProbe:
            httpGet: { path: /ready, port: 3000 }
```
