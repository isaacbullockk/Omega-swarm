# Omega Swarm — Production Deployment Checklist v4.4.0-PROD

## Pre-Deploy Checklist

| #   | Check                                                | Status | Notes                                              |
|-----|------------------------------------------------------|--------|----------------------------------------------------|
| 1   | `.env` file NOT in repo (gitignored)                 | [ ]    | Verify `git check-ignore .env`                     |
| 2   | All secrets in Railway Dashboard, NOT in code        | [ ]    | OPENAI, GROQ, INSTAGRAM, META, BUFFER, etc.       |
| 3   | `data/` directory in `.dockerignore`                 | [ ]    | Prevents ephemeral data leaking into image         |
| 4   | `dist/` built and committed OR built in CI           | [ ]    | Current Dockerfile requires pre-built dist/        |
| 5   | `npm audit` passes (0 critical vulnerabilities)      | [ ]    | Run `npm audit --audit-level=high`                |
| 6   | Docker image builds locally without errors           | [ ]    | `docker build -t omega-swarm:test .`              |
| 7   | Container starts and healthcheck passes locally      | [ ]    | `docker run -p 3001:3001 omega-swarm:test`       |
| 8   | Data persistence works (volume mount test)           | [ ]    | Create data, restart container, verify survives    |
| 9   | Environment variables validated at runtime           | [ ]    | App logs warnings for missing optional env vars    |
| 10  | Rollback plan documented                             | [ ]    | Previous Railway deployment ID noted               |

## Deploy Steps

| Step | Action                             | Command / URL                                |
|------|------------------------------------|----------------------------------------------|
| 1    | Merge PR to `main`                 | GitHub                                       |
| 2    | CI pipeline triggers automatically | GitHub Actions                               |
| 3    | Verify build & Docker scan pass    | Actions tab                                  |
| 4    | Wait for Railway deploy to complete| railway.app dashboard                        |
| 5    | Verify healthcheck on production   | `curl https://ndeku.com/api/health`         |
| 6    | Run smoke tests (3 API calls)      | `curl https://ndeku.com/api/trpc/agent.list`|
| 7    | Monitor error rates for 15 min     | Railway logs / Logtail                       |
| 8    | Verify data persistence            | UI manual test                               |
| 9    | Close deployment ticket            | GitHub Issues / Linear                       |

## Post-Deploy Monitoring (First 24h)

| Check              | Frequency   | Threshold | Action                                |
|--------------------|-------------|-----------|---------------------------------------|
| Healthcheck        | Every 60s   | HTTP 200  | Alert if 2 consecutive failures       |
| Error rate         | Every 5 min | < 1%      | Page on-call if > 5%                  |
| Memory usage       | Every 5 min | < 80%     | Scale up if > 85% for 10 min          |
| Disk usage         | Every 15 min| < 500MB   | Alert if > 80% of Railway volume      |
| Response time p95  | Every 5 min | < 500ms   | Investigate if > 1s                   |

## Rollback Procedure

If deployment fails at any step:

1. **Immediate (0-2 min)**: Railway auto-rollback if healthcheck fails
2. **Manual (2-5 min)**:
```bash
railway login --token $RAILWAY_PROD_TOKEN
railway rollback --service omega-swarm --deployment <PREVIOUS_DEPLOYMENT_ID>
```
3. **Emergency (5-15 min)**: Redeploy previous Docker image

## Security Checklist

| #   | Item                                                   | Status |
|-----|--------------------------------------------------------|--------|
| 1   | Non-root user in container (UID 1001)                  | [ ]    |
| 2   | No secrets in Docker image layers                      | [ ]    |
| 3   | HEALTHCHECK configured                                 | [ ]    |
| 4   | No unnecessary ports exposed                           | [ ]    |
| 5   | Image scanned with Trivy (0 CRITICAL findings)         | [ ]    |
| 6   | `npm audit` clean                                      | [ ]    |
| 7   | Railway service protected by deploy token              | [ ]    |
| 8   | `.gitignore` includes `.env`, `*.log`, `data/`         | [ ]    |
| 9   | CORS restricted in production (not `*`)                | [ ]    |
| 10  | Rate limiting enabled on API                           | [ ]    |
