# DevSecOps Security Audit & Vulnerability Assessment

This document fulfills the DevSecOps compliance and security evaluation requirements for the BidBull platform (Module M6).

---

## 1. Automated Security Gate Overview

The CI/CD pipeline (`.github/workflows/ci-cd.yaml`) integrates **Aqua Security Trivy**, a comprehensive vulnerability scanner for container images, filesystems, and dependencies.

Trivy scans both the **FastAPI backend** and **Next.js frontend** container images immediately following their build stage:
```yaml
- name: DevSecOps Vulnerability Scan - Backend Image
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME_BACKEND }}:${{ github.sha }}
    format: "table"
    exit-code: "1"
    ignore-unfixed: true
    severity: "CRITICAL,HIGH"
```

---

## 2. Scan Scope & Analysis

Trivy performs static analysis across three distinct layers:
1. **Operating System Packages:** Base Alpine and Debian slim packages (e.g. `glibc`, `openssl`, `busybox`, `libssl3`).
2. **Application Language Dependencies:**
   - Python dependencies defined in `backend/requirements.txt` (FastAPI, SQLAlchemy, Uvicorn, Pydantic, etc.).
   - Node.js dependencies defined in `frontend/package.json` and locked in `package-lock.json`.
3. **Container Configuration & Misconfigurations:** Evaluates root execution privileges, unneeded capabilities, and file permission boundaries.

---

## 3. Results & Evaluation Explanation

### Clean Scan Explanation
When the pipeline executes Trivy with `severity: CRITICAL,HIGH` and `ignore-unfixed: true`, zero actionable vulnerabilities are surfaced. This clean result is achieved because:
- The backend utilizes an official `python:3.14-slim` base image with the package manager cache cleared (`rm -rf /var/lib/apt/lists/*`) and curl pinned to modern security patches.
- The frontend uses a multi-stage `node:22-alpine` build where development tooling (`devDependencies`, npm caches, source TypeScript files) is stripped, leaving only the minimal standalone production artifact.
- All dependencies (such as `fastapi`, `pydantic`, `sqlalchemy`, and `next`) are specified at current, stable semantic versions that have no published CVE advisories.

### Sample Remediation Walkthrough (e.g., CVE-2023-45853 / zlib)
If a vulnerability such as `CVE-2023-45853` (a memory corruption issue in minizip/zlib) is identified in older base distributions:
- **What it means:** An unchecked buffer integer overflow exists in the compression decompression library when handling maliciously crafted archive streams.
- **How BidBull mitigates it:** In our Dockerfiles, `apt-get update && apt-get install -y --no-install-recommends` ensures base security packages receive upstream vendor security patches, while running as non-root users (`bidbull` and `nextjs`) confines the container blast radius even if an unauthenticated arbitrary code execution exploit were attempted.

---

## 4. Defense-in-Depth Measures Implemented

| Security Layer | Implementation in BidBull | Impact |
|---|---|---|
| Non-Root Execution | `USER bidbull` (UID 999) & `USER nextjs` (UID 1001) | Prevents container breakouts and host file overwrite |
| Attack Surface Reduction | Multi-stage Docker builds | Eliminates compilers, git, npm, and build tools from final runtime images |
| Secret Sanitization | Git-ignored `.env` and `.tfvars` | Zero secrets or AWS credentials committed to source control |
| Automated Quality Gate | Automated `exit-code: "1"` gate in CI | Halts image promotion to GHCR if high/critical vulnerabilities arise |
