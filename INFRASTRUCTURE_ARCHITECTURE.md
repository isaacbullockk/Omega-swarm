# Omega Swarm — Infrastructure Architecture v4.4.0-PROD
## Architecture Diagram
```
+=============================================================================+
|                           EXTERNAL USERS                                    |
|                    (ndeku.com visitors, Isaac Bullock admin)                |
+===================================+=========================================+
                                    | HTTPS
+-----------------------------------v-----------------------------------------+
|                        Cloudflare (DNS + CDN + SSL)                         |
|                        - CNAME: ndeku.com -> railway.app                   |
|                        - SSL: Full (strict)                                |
|                        - DDoS protection                                   |
|                        - Cache static assets                               |
+-----------------------------------^-----------------------------------------+
                                    |
+-----------------------------------v-----------------------------------------+
|                            Railway Platform                                 |
|                                                                             |
|  +---------------------------v---------------------------+                  |
|  |         Load Balancer (Railway Edge)                  |                  |
|  |         (SSL termination, request routing)            |                  |
|  +---------------------------+---------------------------+                  |
|                              | |                                          |
|  +---------------------------v---------------------------+                  |
|  |              Omega Swarm Container                      |                  |
|  |              (Node.js 20 + Hono + tRPC)                |                  |
|  |                                                         |                  |
|  |   +-----------------+        +-----------------+       |                  |
|  |   |   Static Files  |        |   API Server    |       |                  |
|  |   |     (dist/)     |        |   (Hono app)    |       |                  |
|  |   +--------+--------+        +--------+--------+       |                  |
|  |            |                          |                |                  |
|  |            v                          v                |                  |
|  |   +-----------------+        +-----------------+       |                  |
|  |   |   /assets/*     |        |   /api/*        |       |                  |
|  |   |  (SPA bundle)   |        | (tRPC routers)  |       |                  |
|  |   +-----------------+        +-----------------+       |                  |
|  |                                                         |                  |
|  |   Healthcheck: /api/health                              |                  |
|  |   Graceful shutdown: SIGTERM handled                    |                  |
|  +-------------------------------------------------------+                  |
|                              |                                              |
|  +---------------------------v---------------------------+                  |
|  |           Railway Volume (Persistent Disk)            |                  |
|  |                  /app/data/store.json                 |                  |
|  |              (JSON-backed state — CRITICAL)           |                  |
|  +-------------------------------------------------------+                  |
|                                                                             |
+-----------------------------------^-----------------------------------------+
                                    |
              Outbound API Calls (with retry + circuit breaker)
                                    |
+-----------+-----------+-----------+-----------+
|           |           |           |           |
v           v           v           v           v
+--------+ +--------+ +--------+ +--------+ +--------+
| OpenAI | |  Groq  | |  Meta  | | Buffer | |Kling/  |
|  LLM   | |  LLM   | |Insta-  | | Social | |Pollina-|
|        | |        | | gram   | | Posts  | |tions   |
+--------+ +--------+ +--------+ +--------+ +--------+
```

## Component Descriptions

### 1. Cloudflare (DNS / CDN)
- **Purpose**: DNS resolution, SSL termination, DDoS protection, static asset caching
- **Config**: A/AAAA records pointing to Railway edge IPs
- **TTL**: 300s (low for quick failover)
- **Page Rules**: Cache `/assets/*` for 1 year (hashed filenames)

### 2. Railway Platform
- **Purpose**: Container orchestration, auto-deploy, healthchecks
- **Plan**: Pro (for volumes, custom domains, priority support)
- **Region**: US-East (closest to target audience)
- **Features used**:
  - Dockerfile-based builds
  - Persistent volumes for `data/`
  - Environment variables
  - Healthcheck monitoring
  - Auto-restart on failure

### 3. Omega Swarm Container
- **Base Image**: `node:20-slim`
- **Process**: `dumb-init` -> `npx tsx server.ts`
- **User**: `omegaswarm` (UID 1001, non-root)
- **Resource Limits**:
  - Memory: 512MB (soft), 1GB (hard)
  - CPU: 1 vCPU
- **Open Ports**: 3001 (app)

### 4. Persistent Volume
- **Path**: `/app/data/store.json`
- **Size**: 1GB initial (expandable)
- **Backup**: Daily snapshot to S3 or GitHub artifact
- **Criticality**: HIGH — all application state lives here

### 5. External APIs
All outbound calls should have:
- Timeout: 30s
- Retry: 3 attempts with exponential backoff
- Circuit breaker: Open after 5 consecutive failures

## Security Architecture
```
+------------------+
|     Internet     |
+---------+--------+
          |
+---------v--------+   +---------v--------+
| Cloudflare WAF   |   |  Railway Edge    |
+---------+--------+   +---------+--------+
          |                      |
          v                      v
+---------v------------------------v--------+
|  Omega Swarm Container (non-root)         |
|  - No shell access                        |
|  - Read-only root filesystem              |
|    (except /app/data)                     |
|  - No secrets in env                      |
|    (injected at runtime)                  |
+-------------------------------------------+
```

## Scaling Strategy

### Horizontal Scaling (Current: Not applicable — stateful single container)
Since `data/store.json` is local to the container, horizontal scaling requires:

**Option A**: Move state to external database (PostgreSQL + Drizzle ORM — already in package.json)
**Option B**: Use Railway volumes with shared filesystem (limited to single region)
**Option C**: Stateless containers + external Redis/cache layer

### Vertical Scaling (Immediate)
| Load          | Memory | CPU     | Action                  |
|---------------|--------|---------|-------------------------|
| < 100 req/min | 512MB  | 1 vCPU  | Current                 |
| 100-500/min   | 1GB    | 2 vCPU  | Scale up in Railway     |
| > 500/min     | 2GB+   | 2+ vCPU | Move to PostgreSQL + K8s|

## Disaster Recovery Plan
| Scenario            | RTO    | RPO   | Recovery Steps                          |
|---------------------|--------|-------|-----------------------------------------|
| Container crash     | 2 min  | 0 min | Railway auto-restarts, volume persists  |
| Volume corruption   | 15 min | 24h   | Restore from latest backup              |
| Railway outage      | 30 min | 0 min | Deploy to alternate region              |
| Database corruption | 1 hour | 24h   | Restore from S3, verify integrity       |
| Complete site loss  | 2 hours| 24h   | Redeploy container + restore data       |

## Cost Estimate (Railway Pro)
| Component              | Cost/Month |
|------------------------|-----------|
| Railway Pro Plan       | $5        |
| 1 vCPU, 1GB RAM        | ~$20      |
| 5GB Persistent Volume  | ~$1       |
| 100GB Bandwidth        | ~$5       |
| **Total**              | **~$31**  |
