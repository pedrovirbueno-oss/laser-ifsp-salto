# NEXO Production — Security Architecture & Multi-Tenancy

## Security Measures
1. **Multi-Tenant Row Level Security (RLS)**: PostgreSQL tables restrict rows via `company_id = public.get_auth_company_id()`.
2. **Role-Based Authorization**:
   - `ADMIN`: Full access to setup wizard, users, company settings, products, reasons, shifts, audit logs.
   - `SUPERVISOR`: Management dashboard, machines, OP creation, PDF reports, CSV exports.
   - `OPERATOR`: Simplified touch screen (`/operator`) for production and downtime entry only.
3. **API Key Security**: Machine-to-machine telemetry uses hashed API keys stored in `api_keys`. Raw secrets are never stored in plaintext or sent to the client.
4. **Immutable Audit Trail**: Audit entries use canonical English action names (`LOGIN`, `LOGOUT`, `CREATE`, `UPDATE`, `DELETE`, `START_PRODUCTION`, `REGISTER_PRODUCTION`, `END_PRODUCTION`, `START_DOWNTIME`, `END_DOWNTIME`, `IMPORT_DATA`, `EXPORT_DATA`, `GENERATE_REPORT`). Database policies disallow `UPDATE` and `DELETE` on `audit_logs`.
