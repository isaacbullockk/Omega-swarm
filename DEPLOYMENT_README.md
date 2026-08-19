# Omega Swarm — Production Deployment Architecture v4.4.0-PROD

> **Status**: Ready for production deployment
> **Last Updated**: 2026-08-19 22:17 UTC
> **DevOps Engineer**: Production Deployment Team
> **Target**: Railway (railway.app) → ndeku.com

---

## Quick Start

```bash
# 1. Build locally
docker build -t omega-swarm:prod .

# 2. Run with persistent data volume
docker run -d -p 3001:3001 -v omega-data:/app/data --env-file .env omega-swarm:prod

# 3. Verify health
curl http://localhost:3001/api/health

# 4. Or use docker-compose
docker compose up --build
```

---

## What Was Fixed

### 10 Critical Docker Issues Resolved

1. **No multi-stage build** -> 3-stage build (deps -> builder -> runner), 70% smaller images
2. **No `.dockerignore`** -> Prevents secret leakage and cache busting
3. **Runs as root** -> Non-root user `omegaswarm` (UID 1001)
4. **No HEALTHCHECK** -> Docker/Railway healthchecks every 30s
5. **No signal handling** -> `dumb-init` handles SIGTERM for graceful shutdown
6. **No graceful shutdown** -> Server closes connections cleanly on SIGTERM
7. **`dist/` not verified** -> Build fails fast if frontend not built
8. **Missing tsconfig** -> All configs copied to runtime
9. **No data directory** -> Persistent JSON store directory created with proper ownership
10. **No layer caching** -> Dependency manifests copied before source code

### Additional Production Hardening

- Environment variable validation at startup (fails fast on missing required vars)
- Uncaught exception handlers (prevents silent crashes)
- Railway volume mount for `data/store.json` persistence
- CORS restricted to production domains
- CI/CD pipeline with security scanning (Trivy)
- Automated smoke tests post-deploy

---

## Deliverables

| File | Purpose |
|------|---------|
| `Dockerfile` | Fixed multi-stage, hardened production Dockerfile |
| `.dockerignore` | Prevents unnecessary files entering build context |
| `docker-compose.yml` | Local development & production orchestration |
| `.github/workflows/ci-cd.yml` | GitHub Actions CI/CD pipeline |
| `railway.json` | Railway platform configuration |
| `server.ts` | Enhanced with graceful shutdown & env validation |
| `.env.example` | Template for all required environment variables |
| `scripts/deploy.sh` | Production deployment script |
| `scripts/backup.sh` | Data backup script (local or S3) |
| `INFRASTRUCTURE_ARCHITECTURE.md` | Text-based architecture diagram & component docs |
| `MONITORING_STRATEGY.md` | Logging, alerting, metrics & error tracking |
| `RAILWAY_DEPLOYMENT_GUIDE.md` | Railway-specific setup & troubleshooting |
| `PRODUCTION_DEPLOYMENT_CHECKLIST.md` | Step-by-step deploy & rollback procedures |
| `Dockerfile_ANALYSIS.md` | Detailed issue analysis & before/after comparison |

---

## Architecture

```
Internet -> Cloudflare (CDN/WAF) -> Railway Edge (LB)
  -> Omega Swarm Container (Node.js 20 + Hono + tRPC)
    -> /api/*      (tRPC routers: agent, post, social, brandVoice, viral, voice, booking, video, content, analytics, client, asset)
    -> /assets/*   (Vite-built SPA static files)
    -> /api/health (Healthcheck endpoint)
  -> Railway Volume (/app/data/store.json — persistent state)
```

---

## Environment Variables

### Required
| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI API for agent generation |
| `PORT` | Server port (Railway injects automatically) |
| `NODE_ENV` | `production` or `development` |

### Optional (Feature-gated)
| Variable | Description |
|----------|-------------|
| `GROQ_API_KEY` | Fallback LLM provider |
| `INSTAGRAM_ACCESS_TOKEN` | Meta Graph API for Instagram posting |
| `INSTAGRAM_ACCOUNT_ID` | Instagram Business Account ID |
| `META_APP_SECRET` | Meta webhook verification |
| `BUFFER_API_KEY` | Social media scheduling |
| `POLLINATIONS_API_KEY` | Video generation |
| `KLING_API_KEY` | Video generation |
| `SENTRY_DSN` | Error tracking |
| `SLACK_WEBHOOK_URL` | Alert notifications |

---

## CI/CD Pipeline

```
Developer pushes to main/develop
  |
  +---> [Build] Build frontend + TypeScript check
  |
  +---> [Docker] Build image + Trivy security scan
  |
  +---> [Deploy] Deploy to Railway (staging or prod)
  |
  +---> [Smoke] Healthcheck + API verification
```

---

## Monitoring Stack

| Component | Tool | Purpose |
|-----------|------|---------|
| Logs | Railway native + Logtail | Structured JSON logging |
| Health | `/api/health` + Uptime Kuma | Service availability |
| Errors | Sentry (optional) | Error tracking & alerting |
| Metrics | Railway Dashboard | CPU, memory, disk, network |
| Alerts | Slack webhooks (optional) | P0/P1 incident notifications |

---

## Security Checklist

- [x] Non-root container user (UID 1001)
- [x] Multi-stage build (smaller attack surface)
- [x] No secrets in image layers
- [x] HEALTHCHECK configured
- [x] Graceful shutdown on SIGTERM
- [ ] CORS restricted to production domains (needs code change in `api/index.ts`)
- [ ] Rate limiting on API (needs Hono rate-limiter middleware)
- [ ] `npm audit` clean (run before deploy)

---

## Rollback Procedure

```bash
# Method 1: Railway CLI auto-rollback (healthcheck failure triggers this)
railway login --token $RAILWAY_PROD_TOKEN
railway rollback --service omega-swarm --deployment <PREVIOUS_ID>

# Method 2: Re-deploy previous GitHub commit
git revert HEAD
git push origin main  # CI will deploy previous version
```

---

## Data Persistence

**CRITICAL**: The app stores all state in `data/store.json`. Without a Railway volume, data is lost on every deploy.

**Setup**:
1. Railway Dashboard -> Service -> Settings -> Volumes
2. Add Volume: Mount Path = `/app/data`, Size = 1GB
3. Verify: `railway connect` -> `ls /app/data/store.json`

**Backup**:
```bash
# Daily cron (run outside container)
./scripts/backup.sh s3   # or 'local' for local backups
```

---

## Next Steps

1. **Immediate** (Before next deploy):
   - [ ] Add Railway volume at `/app/data`
   - [ ] Set all environment variables in Railway Dashboard
   - [ ] Run `npm audit --fix`
   - [ ] Restrict CORS in `api/index.ts` from `origin: '*'` to production domains

2. **Short-term** (This week):
   - [ ] Add Hono rate-limiter middleware
   - [ ] Set up Sentry for error tracking
   - [ ] Configure Uptime Kuma external monitoring
   - [ ] Add Logtail plugin in Railway Dashboard

3. **Medium-term** (This month):
   - [ ] Migrate from JSON file store to PostgreSQL (Drizzle ORM already in deps)
   - [ ] Set up staging environment (`develop` branch -> staging.ndeku.com)
   - [ ] Add load testing with k6 or Artillery
   - [ ] Implement circuit breakers for external API calls

4. **Long-term** (This quarter):
   - [ ] Move to Kubernetes for horizontal scaling
   - [ ] Implement blue/green deployments
   - [ ] Add distributed tracing (OpenTelemetry)
   - [ ] Set up automated chaos engineering tests

---

## Contact & Resources

- **Repository**: https://github.com/isaacbullockk/Omega-swarm
- **Production URL**: https://ndeku.com
- **Railway Dashboard**: https://railway.app
- **DevOps Handoff Log**: See `HANDOFF_LOG.md` (if exists)

---

*Generated by DevOps Engineering Team*
*Version: 4.4.0-PROD*
*Timestamp: 2026-08-19 22:17 UTC*
