# NEXO Production — Production Deployment & Hardening Guide

This guide provides technical instructions to deploy **NEXO Production** to a live production environment using **Supabase** (PostgreSQL + Auth + RLS) and **Vercel** (Next.js hosting).

---

## 1. Supabase Cloud Setup

### 1.1 Create Project
1. Log in to [Supabase Dashboard](https://database.new).
2. Click **New Project**, specify Project Name (e.g., `nexo-production-prod`), set a strong database password, and choose your target geographical region (e.g., `sa-east-1` for São Paulo).
3. Copy the project credentials from **Project Settings -> API**:
   - `Project URL` -> `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` -> `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role secret key` -> `SUPABASE_SERVICE_ROLE_KEY` (Server side only!)

### 1.2 Schema Execution (Database Tables, Indexes & RLS)
1. Open the **SQL Editor** in your Supabase dashboard.
2. Copy the entire contents of [`supabase/schema.sql`](../supabase/schema.sql).
3. Click **Run** to execute the DDL script.
4. Confirm that 15 tables are created with `ENABLE ROW LEVEL SECURITY`:
   - `companies`, `users`, `machines`, `products`, `orders`
   - `production_records`, `downtime_records`, `shifts`, `downtime_reasons`
   - `api_keys`, `audit_logs`

### 1.3 Baseline Data Seeding
1. Open SQL Editor and execute [`supabase/seed.sql`](../supabase/seed.sql).
2. This creates baseline downtime reason categories (Setup, Maintenance, Material, Mechanical, Electrical, Adjustment, Quality, Operator) and default company structure.

---

## 2. Vercel Hosting & Environment Variables

### 2.1 Project Import
1. Log in to [Vercel Dashboard](https://vercel.com/new).
2. Import the Git repository.
3. Select **Next.js** framework preset.

### 2.2 Environment Variables Configuration
Configure the following Environment Variables in Vercel (**Settings -> Environment Variables**):

| Variable Name | Value | Target | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_DEMO_MODE` | `false` | Production | Disables mock repository & role switcher |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<your-project>.supabase.co` | All | Public Supabase project endpoint |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `<your-anon-key>` | All | Public client key |
| `SUPABASE_SERVICE_ROLE_KEY` | `<your-service-role-key>` | Production | **Server-side only secret key** |

---

## 3. Post-Deployment Initial Setup

1. **Initial Admin User**:
   - Access the deployed domain e.g. `https://nexo-production.vercel.app/login`.
   - Register or sign in as the primary Administrator.
2. **Setup Wizard (`/setup`)**:
   - Access `/setup` as `ADMIN`.
   - Complete the 7-step onboarding wizard to initialize company metadata, machines, products, shifts, downtime reasons, and operator account.
   - The wizard executes idempotently without creating duplicate records on browser refreshes.
3. **Telemetry API Keys**:
   - Navigate to `/settings` -> **API Keys**.
   - Generate a new API Key for CLP/IoT gateway integration.
   - **Important**: The plain-text key is displayed **once**. Copy it to your gateway configuration immediately.

---

## 4. Operational Verification

1. Run the 20-step smoke test protocol on the live production URL.
2. Verify append-only audit trail entries in `/audit`.
3. Confirm multi-tenant RLS isolation using separate accounts.

