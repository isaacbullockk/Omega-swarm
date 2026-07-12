# Omega Swarm — Render Deployment Guide

## Option 1: Blueprint (Fastest — 30 seconds)

1. Go to https://dashboard.render.com/blueprints
2. Click **"New Blueprint Instance"**
3. Paste repo URL: `https://github.com/isaacbullockk/Omega-swarm`
4. Click **"Connect"** then **"Apply"**
5. Render reads `render.yaml` — auto-configures everything
6. Wait 1 minute — app goes live at `https://omega-swarm.onrender.com`

## Option 2: Manual Web Service (2 minutes)

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub → select **Omega-swarm** repo
4. Configure:
   | Setting | Value |
   |---------|-------|
   | **Name** | `omega-swarm` |
   | **Runtime** | `Node` |
   | **Build Command** | `echo "No build needed"` |
   | **Start Command** | `node server-emergency.js` |
   | **Plan** | `Free` |
5. Click **"Advanced"** → Add Environment Variable:
   - Key: `PORT` | Value: `8080`
   - Key: `NODE_ENV` | Value: `production`
6. Click **"Create Web Service"**
7. Wait 1-2 minutes — app goes live

## Why This Will Work (When Previous Attempts Failed)

| Before (Failed) | Now (Fixed) |
|----------------|-------------|
| `npm install` → OOM crash (512MB limit) | **Zero npm dependencies** — no install needed |
| `plugin-inspect-react-code` broke build | Removed from vite config |
| Server didn't serve static files | Emergency server serves from `public/` |
| Start script pointed to non-existent file | `node server-emergency.js` — file exists |
| No healthcheck → Render killed container | `/api/health` endpoint responds instantly |

## What Works Immediately

- Full dashboard with all 12 AI agents
- Brand Voice page (Isaac's voice pre-loaded)
- Viral Video Studio (3 videos with captions)
- Content Library (6 sample assets)
- Campaigns page
- Memory/Analytics page
- All navigation and UI

## What Needs OpenAI API Key

- AI content generation (agents produce real output)
- Instagram auto-posting
- New viral video creation

**To enable:** Add `OPENAI_API_KEY` as an env var in Render dashboard → Redeploy

## URLs After Deploy

- Primary: `https://omega-swarm.onrender.com`
- Health check: `https://omega-swarm.onrender.com/api/health`
- Fallback (static): `https://de35t4trgzjjw.kimi.page`

## Troubleshooting

**"Build failed"** → Check that "Build Command" is exactly: `echo "No build needed"`
**"Start failed"** → Check that "Start Command" is exactly: `node server-emergency.js`
**"404 on page refresh"** → Normal — wait 30 seconds for deploy to finish
