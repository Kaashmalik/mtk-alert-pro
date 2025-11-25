# Phase 2: Infrastructure Setup
**Duration:** Weeks 4-7 (4 weeks)  
**Budget Allocation:** $75,000 (15%)

## 2.1 Objectives

| Objective | Measurable Goal |
|-----------|-----------------|
| Kubernetes cluster ready | 3 environments (dev, staging, prod) |
| IaC complete | 100% infrastructure as Terraform |
| GitOps configured | ArgoCD deploying all apps |
| Monitoring stack | Prometheus, Grafana, Alertmanager live |
| CI/CD pipelines | All apps with automated deployment |
| Service mesh | Istio configured with mTLS |

## 2.2 Prerequisites

- [ ] Phase 1 completed and approved
- [ ] Cloud provider account (GCP/AWS/Azure)
- [ ] Domain names configured (ssl.cricket)
- [ ] Team trained on Kubernetes

## 2.3 Key Activities

### Week 4: Cloud Foundation

```hcl
# infrastructure/terraform/main.tf
terraform {
  required_version = ">= 1.6.0"
  
  backend "gcs" {
    bucket = "ssl-terraform-state"
    prefix = "terraform/state"
  }
}

module "vpc" {
  source = "./modules/vpc"
  
  project_id   = var.project_id
  region       = var.region
  
  subnets = {
    public   = { cidr = "10.0.1.0/24" }
    private  = { cidr = "10.0.2.0/24" }
    database = { cidr = "10.0.3.0/24" }
  }
}
```

### Week 5: Kubernetes Cluster

```yaml
# infrastructure/kubernetes/karpenter/provisioner.yaml
apiVersion: karpenter.sh/v1alpha5
kind: Provisioner
metadata:
  name: ssl-default
spec:
  requirements:
    - key: karpenter.sh/capacity-type
      operator: In
      values: ["spot", "on-demand"]
  limits:
    resources:
      cpu: 1000
      memory: 1000Gi
  ttlSecondsAfterEmpty: 30
```

### Week 6: GitOps and CI/CD

```yaml
# .github/workflows/ci-cd.yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm test --coverage
      - run: pnpm build
      
  build-and-push:
    needs: lint-and-test
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service: [api-gateway, auth-service, scoring-service]
    steps:
      - name: Build and push
        run: |
          docker build -t $REGISTRY/${{ matrix.service }}:${{ github.sha }} .
          docker push $REGISTRY/${{ matrix.service }}:${{ github.sha }}
```

### Week 7: Monitoring

```yaml
# infrastructure/kubernetes/monitoring/prometheus-values.yaml
prometheus:
  prometheusSpec:
    retention: 15d
    storageSpec:
      volumeClaimTemplate:
        spec:
          resources:
            requests:
              storage: 50Gi

alertmanager:
  config:
    receivers:
      - name: 'slack-notifications'
        slack_configs:
          - channel: '#ssl-alerts'
```

## 2.4 Resources Needed

| Resource | Specification | Monthly Cost |
|----------|---------------|--------------|
| GKE Cluster | 3 nodes, e2-standard-4 | $400 |
| Node Pools | Autoscaling 3-20 | $200-$2000 |
| Cloud SQL | db-standard-2 | $100 |
| **Total** | | **~$1000/month** |

## 2.5 Success Metrics

| Metric | Target |
|--------|--------|
| Infrastructure as Code | 100% |
| Deployment automation | 100% |
| Cluster uptime | 99.9% |
| Mean deployment time | < 10 min |

## 2.6 Post-Phase Review Checklist

- [ ] Kubernetes clusters running
- [ ] Terraform modules complete
- [ ] ArgoCD syncing all apps
- [ ] Monitoring dashboards operational
- [ ] CI/CD pipelines working
- [ ] Security scans passing
