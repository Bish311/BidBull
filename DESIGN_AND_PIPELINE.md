# BidBull — Architecture & DevOps Pipeline Blueprint

A visual blueprint and architectural reference for the BidBull Real-Time Auction Platform, covering architecture design, automated CI/CD pipelines, and cloud infrastructure.

---

## 1. High-Level System Architecture

BidBull connects web bidders and room administrators to a distributed real-time backend through an ingress reverse proxy, backed by PostgreSQL for state persistence and Redis for sub-millisecond pub/sub synchronization.

```mermaid
flowchart TD
    subgraph Clients["Clients & Edge Tier"]
        Admin["Room Admin / Seller"]
        Bidder1["Bidder A (Quick Bid)"]
        Bidder2["Bidder B (Proxy Bid)"]
    end

    subgraph IngressTier["Routing & Edge"]
        Ingress["Nginx Ingress Controller"]
    end

    subgraph ServiceTier["Application Microservices (K8s)"]
        Frontend["Next.js Frontend Pods (x2)\n:3000 (Non-root 'nextjs')"]
        Backend["FastAPI Backend Pods (x2)\n:8000 (Non-root 'bidbull')"]
    end

    subgraph StorageTier["Persistence & Caching Tier"]
        Postgres[("PostgreSQL 16\nState & Bid Ledger\n(Alembic Migrations)")]
        Redis[("Redis 7.2\nPub/Sub Events &\nDistributed Locks")]
    end

    subgraph MonitoringTier["Observability Stack"]
        Prometheus["Prometheus Server\nScrapes :8000/metrics"]
        Grafana["Grafana Dashboards\np95 Latency & Throughput"]
    end

    Admin -->|"HTTP / Static"| Ingress
    Bidder1 -->|"HTTP / REST API"| Ingress
    Bidder2 -->|"WebSockets (/ws)"| Ingress

    Ingress -->|"Route /"| Frontend
    Ingress -->|"Route /api & /ws"| Backend

    Backend -->|"Row-Level Locking (SELECT FOR UPDATE)"| Postgres
    Backend -->|"Channel Broadcast (auction:{room})"| Redis
    Redis -.->|"Instant Push"| Backend

    Prometheus -->|"Scrapes every 10s"| Backend
    Grafana -->|"Visualizes"| Prometheus
```

---

## 2. End-to-End DevOps Lifecycle Pipeline

The complete path of code traveling from local development to a monitored, auto-scaling Kubernetes cluster on AWS.

```mermaid
flowchart LR
    Dev["Developer\nLaptop"] -->|"git push\nsemantic commit"| GitHub["GitHub Repo\n(main branch)"]

    subgraph GHA["GitHub Actions CI/CD (ci-cd.yaml)"]
        direction TB
        Test["Job 1: Test Gate\n• Pytest (15 tests)\n• Next.js Build"]
        Build["Job 2: Containerization\n• Docker Multi-Stage\n• Non-root users"]
        Sec["Job 2b: DevSecOps\n• Trivy Scan\n• Fail on High/Crit"]
        Push["Job 2c: Registry Push\n• GHCR\n• Tag: git-commit-sha"]
        DryRun["Job 3: Deploy Check\n• Helm Lint\n• Template Dry-run"]

        Test --> Build --> Sec --> Push --> DryRun
    end

    GitHub --> GHA

    subgraph AWS["AWS Cloud Infrastructure (Terraform)"]
        direction TB
        VPC["VPC (ap-south-1)\n2 Public + 2 Private Subnets"]
        NAT["NAT Gateway + EIP"]
        EKS["Amazon EKS Cluster\nv1.30 Managed Node Group"]
        VPC --> NAT --> EKS
    end

    GHA -.->|"Provisioned by IaC"| AWS

    subgraph K8s["Kubernetes Workloads (Helm Chart)"]
        direction TB
        Helm["helm upgrade --install\nNamespace: bidbull"]
        Deploy["Backend & Frontend Deployments\n2 Replicas each"]
        HPA["HPA Autoscaler\nTarget: 70% CPU"]
        Helm --> Deploy --> HPA
    end

    AWS --> K8s
```

---

## 3. Real-Time Auction & Proxy Bidding Engine Flow

How incoming quick bids and automated proxy ceiling bids are processed atomically without race conditions:

```mermaid
sequenceDiagram
    autonumber
    actor Bidder as Active Bidder
    participant WS as WebSocket / Ingress
    participant API as FastAPI Backend
    participant Lock as Redis Distributed Mutex
    participant DB as PostgreSQL 16 (ACID)
    participant Channel as Redis Pub/Sub Stream
    participant OtherBidders as Connected Bidders

    Bidder->>WS: Submit Quick Bid ($270.00)
    WS->>API: Route POST /api/bids { amount_cents: 27000, is_direct: true }
    API->>Lock: Acquire Redis Mutex (auction:{item_id})
    activate Lock
    API->>DB: BEGIN TRANSACTION (SELECT FOR UPDATE)
    DB-->>API: Return Item, Highest Bid & Proxy Ceiling
    API->>API: Validate Bidder != Seller (No Self-Bidding)
    API->>API: Evaluate Soft-Close Window (If <120s, extend +120s)
    API->>API: Advance High Bid to $270.00 (Direct Step)
    API->>DB: INSERT into bids ledger & UPDATE item status
    DB-->>API: Transaction Committed (COMMIT)
    API->>Channel: PUBLISH auction:{item_id} (New Price, Winner, Remaining Time)
    API->>Lock: Release Mutex
    deactivate Lock
    Channel-->>OtherBidders: Push WebSocket JSON Broadcast
    Channel-->>Bidder: Push Confirmation ("YOU ARE THE HIGH BIDDER")
```

---

## 4. Terraform AWS Infrastructure Blueprint

Declarative provisioning of the underlying networking and container orchestrator in `ap-south-1`:

```mermaid
graph TD
    subgraph Region["AWS Region: ap-south-1"]
        subgraph VPC["VPC: 10.0.0.0/16"]
            IGW["Internet Gateway"]
            
            subgraph PublicSubnets["Public Subnets (Subnet 1 & 2)"]
                Pub1["Public Subnet 1 (10.0.1.0/24)"]
                Pub2["Public Subnet 2 (10.0.2.0/24)"]
                NAT["NAT Gateway (Elastic IP)"]
            end

            subgraph PrivateSubnets["Private Subnets (Subnet 10 & 11)"]
                Priv1["Private Subnet 1 (10.0.10.0/24)"]
                Priv2["Private Subnet 2 (10.0.11.0/24)"]
                Nodes["EKS Worker Node Group\n(t3.medium instances, Min: 1, Max: 4)"]
            end

            ControlPlane["Amazon EKS Control Plane (v1.30)\nIAM Role: bidbull-eks-cluster-role"]
        end
    end

    IGW <--> PublicSubnets
    NAT <--> PublicSubnets
    NAT <--> PrivateSubnets
    ControlPlane <--> Nodes
```

---

## 5. Kubernetes Helm Package & Ingress Routing

Hierarchical mapping of Kubernetes resources managed by `helm/bidbull`:

```mermaid
flowchart TD
    Ingress["Nginx Ingress (bidbull.local)"]

    Ingress -->|"path: /"| SvcFE["bidbull-frontend (ClusterIP :3000)"]
    Ingress -->|"path: /api"| SvcBE["bidbull-backend (ClusterIP :8000)"]
    Ingress -->|"path: /ws"| SvcBE
    Ingress -->|"path: /metrics"| SvcBE

    SvcFE --> PodFE1["Pod: frontend-1"]
    SvcFE --> PodFE2["Pod: frontend-2"]

    SvcBE --> PodBE1["Pod: backend-1"]
    SvcBE --> PodBE2["Pod: backend-2"]
    
    HPA["HPA Autoscaler\n(CPU > 70%)"] -.->|"Auto-scale to 8 Pods"| PodBE1

    PodBE1 --> SvcPG["bidbull-postgres (:5432)"]
    PodBE1 --> SvcRedis["bidbull-redis (:6379)"]

    SvcPG --> PVC["PVC: postgres-storage (5Gi)"]
```

---

## 6. Observability & Monitoring Feedback Loop

Continuous scraping and metrics visualization:

```mermaid
flowchart LR
    App["FastAPI Backend\n(:8000/metrics)"] -->|"Scraped every 10s"| Prom["Prometheus Server\n(prometheus-values.yaml)"]
    
    Prom -->|"Data Source Query"| Grafana["Grafana Dashboards\n(:3001)"]
    
    subgraph DashboardPanels["Live Grafana Panels"]
        P1["Throughput: sum(rate(http_requests_total[1m]))"]
        P2["p95 Latency: histogram_quantile(0.95, ...)"]
        P3["Status Codes: 200 vs 4xx vs 5xx"]
        P4["Process Memory: process_resident_memory_bytes"]
    end

    Grafana --> DashboardPanels
```

---

## Student Credentials

Student Credentials: BISHWAYAN CHATTERJEE 24BCS10200
