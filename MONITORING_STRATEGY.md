# Omega Swarm — Monitoring & Logging Strategy v4.4.0-PROD

## 1. Architecture Overview

```
+------------------+     +-------------------+     +------------------+
|  Omega Swarm     |     |  Railway Platform |     |  External        |
|  Container       |     |                   |     |  Services        |
+------------------+     +-------------------+     +------------------+
         ^                        ^                        ^
         |                        |                        |
    logs/metrics           healthchecks              API calls
         |                        |                        |
+--------v---------+   +---------v---------+   +----------v----------+
|  Logtail /       |   | Railway Metrics   |   | Uptime Kuma (self)  |
|  Datadog         |   | (CPU/Mem/Disk)    |   | (external ping)     |
|  (structured)    |   |                   |   |                     |
+------------------+   +-------------------+   +---------------------+
```

## 2. Logging Strategy

### 2.1 Log Levels
Use structured JSON logs for machine parsing.

```typescript
// Example structured log format
{
  "timestamp": "2026-08-19T22:17:00.000Z",
  "level": "INFO",
  "service": "omega-swarm",
  "version": "4.4.0",
  "requestId": "req_abc123",
  "method": "GET",
  "path": "/api/health",
  "durationMs": 12,
  "statusCode": 200,
  "message": "Healthcheck passed"
}
```

### 2.2 What to Log

| Level | What to Log                                      | Retention |
|-------|--------------------------------------------------|-----------|
| ERROR | Unhandled exceptions, tRPC errors, API failures  | 90 days   |
| WARN  | Slow requests (>1s), high memory usage           | 30 days   |
| INFO  | Server startup/shutdown, deployment events       | 14 days   |
| DEBUG | Request/response bodies (exclude secrets)        | 7 days    |

### 2.3 What NOT to Log
- API keys, tokens, passwords
- User PII (emails, names)
- Request bodies containing `accessToken`, `password`, `secret`

### 2.4 Railway Log Collection
Railway captures stdout/stderr automatically. Add Logtail or Datadog integration in Railway Dashboard -> Plugins.

```bash
# Recommended: Logtail (free tier: 1GB/month)
# 1. Install Logtail plugin in Railway Dashboard
# 2. Set LOGTAIL_SOURCE_TOKEN environment variable
# 3. Use pino or winston with Logtail transport
```

### 2.5 Recommended Logger (Hono + Pino)

```typescript
import { pino } from 'pino';
import { logger } from 'hono/logger';

const pinoLogger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'production'
    ? undefined
    : { target: 'pino-pretty', options: { colorize: true } }
});

// Add to Hono app
app.use(logger((message: string) => pinoLogger.info(message)));
```

## 3. Health Monitoring

### 3.1 Healthcheck Endpoint (Already exists at `/api/health`)
Enhanced version with dependency checks:

```typescript
app.get('/api/health', async (c) => {
  const checks = {
    database: checkDiskWritable(),
    openai: await checkOpenAIConnectivity(),
    memory: process.memoryUsage().heapUsed / 1024 / 1024,
    uptime: process.uptime(),
  };
  const healthy = checks.database.ok && checks.memory < 512;
  return c.json(
    {
      status: healthy ? 'ok' : 'degraded',
      version: process.env.npm_package_version || '4.4.0',
      checks,
      timestamp: new Date().toISOString(),
    },
    healthy ? 200 : 503
  );
});
```

### 3.2 Uptime Monitoring (Uptime Kuma - Self-Hosted)
Deploy Uptime Kuma on a $5/month VPS or free Render instance:

```yaml
# docker-compose for Uptime Kuma
version: '3.8'
services:
  uptime-kuma:
    image: louislam/uptime-kuma:latest
    ports:
      - "3002:3001"
    volumes:
      - uptime-kuma-data:/app/data
    restart: unless-stopped
volumes:
  uptime-kuma-data:
```

Monitors to configure:

| Monitor           | Type    | Interval | URL                                    |
|-------------------|---------|----------|----------------------------------------|
| Health            | HTTP(s) | 60s      | https://ndeku.com/api/health           |
| API               | HTTP(s) | 120s     | https://ndeku.com/api/trpc/agent.list  |
| SSL Certificate   | HTTP(s) | 24h      | https://ndeku.com                      |
| Response Time     | HTTP(s) | 60s      | https://ndeku.com                      |

### 3.3 Railway Native Monitoring
Railway Dashboard provides: CPU, Memory, Network I/O, Disk usage

Set alerts:
| Metric          | Threshold | Action                            |
|-----------------|-----------|-----------------------------------|
| Memory > 85%    | 10 min    | Scale to larger instance          |
| CPU > 80%       | 5 min     | Enable auto-scaling               |
| Disk > 80%      | Immediate | Clean old data or resize volume   |
| Crash loop      | 3 restarts| Stop deployment, page on-call     |

## 4. Alerting Strategy

### 4.1 Alert Severity Matrix
| Severity    | Condition                    | Channel           | Response |
|-------------|------------------------------|-------------------|----------|
| P0-Critical | Service down, data corrupt   | PagerDuty / SMS   | 5 min    |
| P1-High     | Error rate > 5%, memory leak | Slack #alerts     | 15 min   |
| P2-Medium   | Slow responses, API degrade  | Slack #warnings   | 1 hour   |
| P3-Low      | Security scan findings       | Email weekly      | 24 hours |

### 4.2 Slack Webhook Integration
```typescript
if (severity === 'critical') {
  await fetch(process.env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `P0 ALERT: Omega Swarm ${error.message}`
    }),
  });
}
```

## 5. Error Tracking (Sentry)
```bash
npm install @sentry/node @sentry/profiling-node
```

```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'production',
  tracesSampleRate: 0.1,
  profilesSampleRate: 0.1,
});

app.onError((err, c) => {
  Sentry.captureException(err);
  return c.json({ error: 'Internal server error' }, 500);
});
```

## 6. Performance Monitoring

### 6.1 Key Metrics
| Metric             | Target   | How to Measure          |
|--------------------|----------|-------------------------|
| p50 response time  | < 100ms  | Hono middleware timer   |
| p95 response time  | < 500ms  | Hono middleware timer   |
| p99 response time  | < 1s     | Hono middleware timer   |
| Error rate         | < 0.1%   | Log analysis            |
| Uptime             | 99.9%    | Uptime Kuma / Railway   |
| Deploy frequency   | Daily    | GitHub Actions          |
| Lead time          | < 1 hour | GitHub merge to deploy  |
| Recovery time      | < 15 min | Incident logs           |

### 6.2 Response Time Middleware
```typescript
app.use('*', async (c, next) => {
  const start = performance.now();
  await next();
  const duration = performance.now() - start;
  pinoLogger.info({
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    durationMs: Math.round(duration)
  });
});
```

## 7. Data Integrity Monitoring
The `data/store.json` file is critical. Monitor:
- File size growth (alert if > 100MB)
- Corruption detection (JSON parse failures)
- Backup verification (daily restore test)

```bash
# Daily backup cron (run outside container)
0 3 * * * cp /path/to/data/store.json /backups/store-$(date +%Y%m%d).json
# Keep last 30 days
find /backups -name "store-*.json" -mtime +30 -delete
```

## 8. Dashboard Setup

### Railway Dashboard
https://railway.app/project/<PROJECT_ID>/service/<SERVICE_ID>

### Recommended Grafana Dashboard (if using Prometheus)
Panels: Request rate, Error rate, p95 latency, Active connections, Memory usage, Disk I/O
