# NEXO Production — Demo Mode vs Production Mode Specification

## Environment Flag
Environment mode is governed explicitly by:
`NEXT_PUBLIC_DEMO_MODE`

- **Demo Mode (`NEXT_PUBLIC_DEMO_MODE=true`)**:
  - Uses the in-memory / local state Demo Repository pre-seeded with "Metalúrgica Vale Industrial" 60-day historical data.
  - Renders the interactive **Demo Role Switcher** dropdown in the top header (Admin, Supervisor, Operator).
  - Provides 1-click login buttons on `/login`.

- **Production Mode (`NEXT_PUBLIC_DEMO_MODE=false`)**:
  - Uses real Supabase Auth + Supabase PostgreSQL + Row Level Security (RLS).
  - Completely hides/removes the Role Switcher from the frontend.
  - If Supabase environment variables are missing, throws an explicit configuration exception and blocks execution.
