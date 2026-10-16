# Kubernetes Troubleshooting Lab

This directory contains deliberately misconfigured Kubernetes manifests designed to demonstrate triage and diagnostic workflows during live presentations and DevOps evaluations.

---

## Exercise 1: ImagePullBackOff Diagnosis

### 1. Apply Broken Deployment
```bash
kubectl apply -f troubleshooting/broken-image.yaml
```

### 2. Observe Failure
```bash
kubectl get pods -n bidbull
```
Expected output:
```text
NAME                                     READY   STATUS             RESTARTS   AGE
bidbull-broken-image-78df6f88d9-4m8q2   0/1     ImagePullBackOff   0          25s
```

### 3. Diagnose Root Cause
```bash
kubectl describe pod -l app=bidbull-broken-image -n bidbull
kubectl get events -n bidbull --sort-by=.lastTimestamp
```
**Diagnosis:** The events section shows `Failed to pull image "ghcr.io/bidbull/bidbull-backend:non-existent-v999.0": rpc error: code = NotFound`.

### 4. Remediation
Update the container image in the deployment to a valid tag (e.g. `ghcr.io/bidbull/bidbull-backend:latest` or a verified commit SHA) and re-apply:
```bash
kubectl delete -f troubleshooting/broken-image.yaml
```

---

## Exercise 2: Broken Service / Missing Endpoints

### 1. Apply Broken Service
```bash
kubectl apply -f troubleshooting/broken-service.yaml
```

### 2. Investigate Service Routing
```bash
kubectl get svc bidbull-broken-service -n bidbull
kubectl get endpoints bidbull-broken-service -n bidbull
```
Expected output:
```text
NAME                     ENDPOINTS
bidbull-broken-service   <none>
```

### 3. Diagnose Root Cause
Inspect the Service selector and compare with existing pod labels:
```bash
kubectl get svc bidbull-broken-service -n bidbull -o jsonpath='{.spec.selector}'
kubectl get pods -n bidbull --show-labels
```
**Diagnosis:** The Service selector targets `app=bidbull-backend-typo-label`, whereas running backend pods carry `app=bidbull-backend`. Because Kubernetes services use label selectors to discover target endpoints, no endpoints are registered and traffic is dropped.

### 4. Remediation
Fix the selector in `broken-service.yaml` to match `app: bidbull-backend`:
```bash
kubectl set selector service bidbull-broken-service app=bidbull-backend -n bidbull
kubectl get endpoints bidbull-broken-service -n bidbull
kubectl delete -f troubleshooting/broken-service.yaml
```

---

## Student Credentials

Student Credentials: BISHWAYAN CHATTERJEE 24BCS10200

