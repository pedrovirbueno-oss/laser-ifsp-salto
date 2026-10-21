# NEXO Production — System Architecture Specification

## Overview
NEXO Production is an enterprise B2B SaaS platform designed to digitize shop-floor production tracking and monitor Overall Equipment Effectiveness (OEE) in industrial plants.

## Architectural Principles
1. **Multi-Tenancy**: Every database table includes a mandatory `company_id` foreign key. Row Level Security (RLS) guarantees data isolation.
2. **Repository Abstraction Pattern**: High-level UI and services depend exclusively on repository interfaces (`IMachineRepository`, `IOrderRepository`, `IProductionRepository`, `IDowntimeRepository`, etc.). Data provider switching occurs strictly in the infrastructure layer via `NEXT_PUBLIC_DEMO_MODE`.
3. **Decoupled Business Services**: Business operations (`startProduction`, `registerProduction`, `startDowntime`, `endDowntime`, `endProduction`) are encapsulated in pure services (`ProductionService`).
4. **Single Source of Truth**: Machine status is dynamically derived from open production and downtime logs, preventing status sync bugs.

## Software Stack
- **Framework**: Next.js 14 App Router
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS
- **Database & Auth**: Supabase (PostgreSQL + RLS + Auth + SSR)
- **Charts & Reporting**: Recharts, jsPDF + jspdf-autotable, PapaParse
