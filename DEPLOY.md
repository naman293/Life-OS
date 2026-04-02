# Life OS Professional Deployment Guide

This document outlines the professional deployment procedures for Life OS. 

## Environment Prerequisites
Whether deploying to a cloud native provider (Vercel) or your own Dockerized VPS (AWS/DigitalOcean), you require **Production Environment Variables**:

1. **Authentication (Clerk)**
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: From your Clerk Dashboard (Live Environment).
   - `CLERK_SECRET_KEY`: Live secret key.

2. **Database (Neon)**
   - `DATABASE_URL`: Ensure this points to the production, pooled connection string.

3. **Application URL**
   - `NEXT_PUBLIC_APP_URL`: Your custom production domain (e.g. `https://lifeos.app`).

---

## Deployment Path 1: Dockerized VPS (Self-Hosted Control)

Using Docker gives you full control. We have provided a highly-optimized multi-stage Dockerfile that leverages **Turborepo** pruning and **Next.js Standalone** mode to create a tiny, secure production image.

### 1. Build the Docker Image
Push your code to your server and navigate into the root directory.

```bash
# This uses the isolated builder to install deps, build nextjs, and start production server
docker build -t lifeos-web -f apps/web/Dockerfile .
```

### 2. Configure Production Secrets
Create a `.env.production` file on your server in the same folder as `docker-compose.yml`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_your_key_here
CLERK_SECRET_KEY=sk_live_your_key_here
DATABASE_URL=postgres://user:pass@host/lifeos_db
```

### 3. Run Production Containers
The orchestrated `docker-compose.yml` file handles networking the Next.js app securely alongside an optional self-hosted local database if you don't want to use Neon Serverless (although Neon is strongly recommended).

```bash
docker-compose --env-file .env.production up -d
```
The application is now running securely behind port `3000`. You can map this with a Reverse Proxy like NGINX or Traefik and attach an SSL certificate.

---

## Deployment Path 2: Vercel (Cloud Native)

Vercel is the creator of Next.js and Turborepo. Deploying Life OS to Vercel provides out-of-the-box global edge caching.

### 1. Link the Repository
- Connect your GitHub repository to Vercel via the Vercel Dashboard -> Add New Project.

### 2. Configure the Monorepo
Vercel automatically detects Next.js inside Turborepo!
- **Framework Preset**: Next.js
- **Root Directory**: `apps/web`
- **Build Command**: `cd ../.. && npx turbo run build --filter=web...` (Automatically provided by Vercel)

### 3. Inject Environment Variables
Provide the `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, and `DATABASE_URL` during the project setup screen.

### 4. Deploy
Click "Deploy". The CI/CD pipeline starts instantly. Note: Ensure you push these changes to GitHub first.

---

## Continuous Integration (CI/CD)
This repository includes a professional GitHub Actions workflow located in `.github/workflows/deploy.yml`.

- **On every push to `main`**: 
  - Code is strictly typed-checked.
  - Linting passes must succeed.
  - Test production build run is verified.
- You can optionally uncomment the final step in the workflow to auto-publish your customized Docker Image directly to **Docker Hub** or **GitHub Container Registry**.
