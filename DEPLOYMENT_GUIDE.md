# Deployment Guide - Bluconnet B2B Platform

## Your Repository
**GitHub:** https://github.com/SUBHADIPDEYSuRvA0/Bluconnet-media-database.git

---

## Deploy on Render (Recommended for Backend + Frontend)

### Option 1: Using Blueprint (Easiest)

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **New** → **Blueprint**
3. Connect your GitHub repository: `SUBHADIPDEYSuRvA0/Bluconnet-media-database`
4. Render will automatically detect `render.yaml`
5. Review and confirm the services:
   - **bluconnet-backend** (Node.js API)
   - **bluconnet-frontend** (Static Site)
   - **bluconnet-database** (PostgreSQL)
6. Click **Apply** to create all services

### Option 2: Manual Setup

#### Backend:
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **New** → **Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Name:** bluconnet-backend
   - **Root Directory:** server
   - **Runtime:** Node
   - **Build Command:** `npm ci && npx prisma generate && npm run build`
   - **Start Command:** `npm start`
5. Add Environment Variables:
   - `DATABASE_URL` - Your Neon/PostgreSQL connection string
   - `JWT_SECRET` - Generate a random string (min 32 chars)
   - `JWT_REFRESH_SECRET` - Generate another random string
   - `CORS_ORIGIN` - Your frontend URL (e.g., https://your-app.vercel.app)
   - `NODE_ENV` - production

#### Frontend:
1. Click **New** → **Static Site**
2. Connect your GitHub repository
3. Configure:
   - **Name:** bluconnet-frontend
   - **Root Directory:** client
   - **Build Command:** `npm ci && npm run build`
   - **Publish Directory:** dist
4. Add Environment Variable:
   - `VITE_API_URL` - Your backend URL (e.g., https://bluconnet-backend.onrender.com)

---

## Deploy on Vercel (Frontend + API Proxy)

### Option 1: Using Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **New Project**
3. Import your GitHub repository: `SUBHADIPDEYSuRvA0/Bluconnet-media-database`
4. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** (leave empty, uses root)
   - **Build Command:** `cd client && npm ci && npm run build`
   - **Output Directory:** `client/dist`
5. Add Environment Variables:
   - `VITE_API_URL` - Your Render backend URL (e.g., https://bluconnet-backend.onrender.com)
6. Click **Deploy**

### Option 2: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

---

## Environment Variables Reference

### Backend (Render)
| Variable | Description | Example |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | `your-super-secret-key` |
| `JWT_REFRESH_SECRET` | Refresh token secret | `your-refresh-secret` |
| `CORS_ORIGIN` | Allowed frontend origin | `https://your-app.vercel.app` |
| `NODE_ENV` | Environment | `production` |
| `PORT` | Server port | `4000` |

### Frontend (Vercel/Render)
| Variable | Description | Example |
|----------|-------------|----------|
| `VITE_API_URL` | Backend API URL | `https://bluconnet-backend.onrender.com` |

---

## Database Setup (Neon - Free Tier)

1. Go to [neon.tech](https://neon.tech/)
2. Create a new project
3. Copy the connection string
4. Use it as your `DATABASE_URL` in Render

---

## Post-Deployment Steps

1. **Run Database Migrations:**
   ```bash
   # In Render dashboard, go to your backend service → Shell
   npx prisma migrate deploy
   ```

2. **Seed Database (Optional):**
   ```bash
   npm run prisma:seed
   ```

3. **Verify Deployment:**
   - Backend Health: `https://your-backend.onrender.com/api/health`
   - Frontend: `https://your-frontend.vercel.app`

---

## Support

- [Render Docs](https://render.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Neon Docs](https://neon.tech/docs)
