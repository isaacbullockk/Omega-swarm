# Omega Swarm — Railway-Specific Deployment Guide v4.4.0-PROD

## Current State
- **Platform**: Railway (railway.app)
- **Domain**: ndeku.com
- **Repository**: isaacbullockk/Omega-swarm
- **Deployment method**: GitHub push -> Dockerfile build
- **Issues**: Dockerfile builds failing, no volume persistence, no healthcheck validation

## Railway Configuration Files

### 1. railway.json (Updated)
The existing `railway.json` has been updated with production-grade settings:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile",
    "watchPatterns": [
      "package.json",
      "package-lock.json",
      "Dockerfile",
      "api/**",
      "db/**",
      "server.ts",
      "dist/**"
    ]
  },
  "deploy": {
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3,
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 30,
    "healthcheckInterval": 15,
    "startCommand": null,
    "sleepApplication": false,
    "numReplicas": 1
  },
  "network": {
    "allowedIps": [],
    "allowedOutboundIps": []
  }
}
```

**Key Changes from v4.3**:
- `restartPolicyMaxRetries`: 10 -> 3 (fail fast, don't loop forever)
- Added `healthcheckInterval`: 15s
- Added `watchPatterns` for selective rebuilds
- `sleepApplication: false` prevents idle sleeping

### 2. Environment Variables (Railway Dashboard)
Navigate to: Railway Dashboard -> Omega Swarm Service -> Variables -> New Variable

| Variable                | Required | Example              | Description                         |
|-------------------------|----------|----------------------|-------------------------------------|
| `PORT`                  | Yes      | `3001`               | Railway injects this automatically  |
| `NODE_ENV`              | Yes      | `production`         | Enables production optimizations    |
| `OPENAI_API_KEY`        | Yes      | `sk-...`             | OpenAI API key                      |
| `GROQ_API_KEY`          | No       | `gsk_...`            | Groq fallback LLM                   |
| `INSTAGRAM_ACCESS_TOKEN`| No       | `EAAG...`            | Meta Graph API token                |
| `INSTAGRAM_ACCOUNT_ID`  | No       | `1784...`            | Instagram Business Account ID       |
| `META_APP_SECRET`       | No       | `abc1...`            | Meta app secret                     |
| `BUFFER_API_KEY`        | No       | `1/abc...`           | Buffer API for social scheduling    |
| `POLLINATIONS_API_KEY`  | No       | `poll...`            | Pollinations video generation       |
| `KLING_API_KEY`         | No       | `klin...`            | Kling video generation              |
| `LOG_LEVEL`             | No       | `info`               | Pino log level                      |
| `SENTRY_DSN`            | No       | `https://...`        | Error tracking DSN                  |
| `SLACK_WEBHOOK_URL`     | No       | `https://hooks...`   | Alert notifications                 |

**CRITICAL**: Never commit `.env` files. Railway variables are encrypted at rest.

### 3. Volume Setup (Data Persistence)
The app stores all state in `data/store.json`. Without a volume, data is lost on every deploy.

**Setup Steps**:
1. Railway Dashboard -> Omega Swarm Service -> Settings -> Volumes
2. Click "Add Volume"
3. Mount Path: `/app/data`
4. Size: Start with 1GB
5. Click "Add Volume"

**Verify persistence**:
```bash
# SSH into running container (Railway CLI)
railway connect

# Check data directory
ls -la /app/data/
cat /app/data/store.json | head -20
```

### 4. Custom Domain (ndeku.com)
Already configured. Verify:
1. Railway Dashboard -> Omega Swarm -> Settings -> Domains
2. Ensure `ndeku.com` is listed
3. DNS: Cloudflare A record pointing to Railway edge IP
4. SSL: Enable "Full (strict)" in Cloudflare

### 5. Railway CLI Commands
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to project
railway link --project <PROJECT_ID>

# View logs
railway logs --follow

# View deployment status
railway status

# Environment variables
railway variables --set OPENAI_API_KEY=sk-...
railway variables --get OPENAI_API_KEY

# Deploy manually (not needed with GitHub integration)
railway up

# Rollback to previous deployment
railway rollback --deployment <DEPLOYMENT_ID>

# Connect to running container
railway connect
```

## Common Railway Issues & Fixes

### Issue 1: Build Failures (Dockerfile)
**Symptom**: `Error: failed to solve: rpc error`
**Cause**: `node_modules` copied into Docker context, or `dist/` missing
**Fix**:
- Ensure `.dockerignore` excludes `node_modules` and `data/`
- Ensure `dist/` is built before Docker build (CI should do this)
- Use multi-stage build (provided in fixed Dockerfile)

### Issue 2: Data Loss on Deploy
**Symptom**: All campaigns/posts disappear after new deploy
**Cause**: No persistent volume mounted
**Fix**:
- Add Railway volume at `/app/data` (see Section 3 above)
- Verify in logs: `data/store.json` path is writable

### Issue 3: Healthcheck Failures
**Symptom**: Container keeps restarting, 502 errors
**Cause**: `/api/health` returns non-200 or times out
**Fix**:
- Verify healthcheck endpoint exists and returns JSON
- Check `railway.json` healthcheckTimeout is >= 30s
- Check app is actually listening on `process.env.PORT`

### Issue 4: Environment Variables Not Loading
**Symptom**: API calls fail with 401/403, OpenAI errors
**Cause**: Variables not set in Railway Dashboard
**Fix**:
- Check Railway Dashboard -> Variables
- Redeploy after adding variables
- Verify in logs: `console.log(process.env.OPENAI_API_KEY ? 'OK' : 'MISSING')`

### Issue 5: CORS Errors in Production
**Symptom**: Frontend can't call API, browser blocks requests
**Cause**: `cors({ origin: '*' })` is insecure and may be blocked
**Fix**:
```typescript
const allowedOrigins = [
  'https://ndeku.com',
  'https://www.ndeku.com',
  process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null,
].filter(Boolean);

app.use('*', cors({
  origin: allowedOrigins,
  credentials: true,
}));
```

### Issue 6: Memory Limits (OOM Kills)
**Symptom**: Container restarts randomly, `Exit code 137`
**Cause**: Node.js heap grows beyond Railway memory limit
**Fix**:
- Add to Railway variables: `NODE_OPTIONS=--max-old-space-size=384`
- Monitor heap usage in `/api/health`
- Consider upgrading Railway plan for more memory

## Railway Plan Recommendations

| Feature             | Free Plan | Pro ($5/mo) | Recommendation                       |
|---------------------|-----------|-------------|--------------------------------------|
| Deployments         | Limited   | Unlimited   | **Pro** — needed for CI/CD           |
| Persistent Volumes  | No        | Yes         | **Pro** — data persistence required  |
| Custom Domains      | Yes       | Yes         | Works on both                        |
| Priority Support    | No        | Yes         | Pro for production                   |
| Uptime SLA          | None      | 99.9%       | Pro for reliability                  |

**Recommendation**: Upgrade to **Railway Pro** immediately. The Free plan does not support persistent volumes, which means data loss on every deploy.

## Deployment Workflow (Railway + GitHub)
```
Developer pushes to main
  |
  +---> GitHub Actions triggers
  |       |
  |       +---> Build frontend
  |       +---> Run tests
  |       +---> Build Docker image
  |       +---> Push to GHCR
  |       +---> Deploy to Railway (staging or prod)
  |
  +---> Railway pulls image / builds from Dockerfile
  |
  +---> Run healthcheck
  |       |
  |       +---> Pass: Route traffic
  |       +---> Fail: Rollback to previous deployment
  |
  +---> Smoke tests verify production
```
