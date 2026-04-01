# User Setup Checklist — Life OS

This file tells you **exactly** what you need to create, where to get it, and what to give to the AI so the app can be fully wired up. Work through these in order.

---

## 1. Clerk Authentication (Required)

**What it is:** Handles all user sign-up, sign-in, sessions, and JWTs. Free tier is generous.

**Steps:**
1. Go to [https://clerk.com](https://clerk.com) and create a free account
2. Click **"Create Application"**
3. Name it `Life OS`
4. Enable these sign-in methods: **Email + Password** and **Google** (recommended)
5. Click **Create Application**
6. On the next screen, you'll see two keys. Copy both:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

> **Give these two values to the AI.**

---

## 2. PostgreSQL Database (Required)

You have two options. Pick one:

### Option A — Neon (Recommended: Free Cloud Postgres, no Docker needed)

1. Go to [https://neon.tech](https://neon.tech) and create a free account
2. Click **"New Project"**
3. Name it `lifeos`
4. Region: pick the one closest to you (e.g., `aws-ap-southeast-1` for India)
5. Click **Create Project**
6. On the dashboard, find **"Connection string"** — it looks like:

```
postgresql://lifeos_owner:AbCdEfGhIj@ep-xxxx.ap-southeast-1.aws.neon.tech/lifeos?sslmode=require
```

7. Copy the full connection string

> **Give this connection string to the AI.**

### Option B — Docker (Local only, requires Docker Desktop installed)

If you have Docker Desktop running, the AI will handle starting the database automatically. Just confirm you have Docker installed:
- Mac: [https://docs.docker.com/desktop/install/mac-install/](https://docs.docker.com/desktop/install/mac-install/)

> **Tell the AI: "I have Docker installed"** and it will spin up Postgres locally.

---

## 3. Summary — What to Give the AI

Once you've done steps 1 and 2, paste this into the chat (fill in your real values):

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
CLERK_SECRET_KEY=sk_test_YOUR_KEY_HERE
DATABASE_URL=postgresql://YOUR_CONNECTION_STRING_HERE
```

---

## 4. Optional — Future Services (Not needed now)

These are NOT required for the current build. Listed here for future reference:

| Service | Purpose | When Needed |
|---|---|---|
| Resend / SendGrid | Transactional emails (reminders) | Phase 2 |
| Clerk Webhooks | Sync user on sign-up to DB | Can do manually now |
| Vercel | Deploy the Next.js app | When ready to go live |
| Neon (prod branch) | Separate prod database | Before deploying |

---

## 5. Files to NEVER commit to GitHub

The following files contain secrets. They are already in `.gitignore`:

- `apps/web/.env.local`
- `apps/web/.env`

Do NOT share these files or push them to a public GitHub repo.
