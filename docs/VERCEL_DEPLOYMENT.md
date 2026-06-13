# Vercel Deployment Guide - Full Stack LMS

This guide outlines how to deploy the Learning Management System (LMS) codebase to Vercel with a PostgreSQL database (hosted on Supabase).

---

## 1. Prerequisites
- A **GitHub, GitLab, or Bitbucket** repository containing this project's code.
- A **Supabase** (or any PostgreSQL) database hosting account.
- A **Vercel** account.

---

## 2. Prepare Environment Variables
You will need to configure the following environment variables in Vercel before triggering your deployment:

| Variable Name | Description | Example Value |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL direct connection string | `postgres://postgres.xxxx:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project API endpoint url | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase project anonymous API key | `sb_publishable_5CJTvguGRtJ5Q-hdzGaCYg_Z8c4XA_0` |
| `JWT_SECRET` | Secret key used for signing session tokens | `your_long_random_jwt_secret_here` |

---

## 3. Deploying via Vercel Dashboard

1. Log in to [Vercel](https://vercel.com).
2. Click **Add New** -> **Project**.
3. Import your Git repository containing the LMS project.
4. **Project Configuration**:
   - Vercel will auto-detect the Next.js setup.
   - Set the **Root Directory** to `./` (the workspace root).
5. **Build and Development Settings**:
   - Vercel will automatically compile the workspaces since Next.js is configured inside `package.json` workspaces.
   - **Build Command**: `npm run build`
   - **Output Directory**: `frontend/.next` (Vercel resolves this automatically).
6. **Environment Variables**:
   - Add all key-value pairs listed in the prerequisites section.
7. Click **Deploy**. Vercel will install dependencies, compile the project, run TypeScript type-checks, and provision a serverless production URL!
