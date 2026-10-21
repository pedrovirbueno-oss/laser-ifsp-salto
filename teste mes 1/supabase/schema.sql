-- NEXO PRODUCTION - SUPABASE DATABASE SCHEMA MIGRATION
-- Multi-Tenant Industrial SaaS Platform (Production Ready Version)
-- Designed for safe idempotent execution on new or existing Supabase Cloud databases.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. COMPANIES TABLE
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  legal_name VARCHAR(255) NOT NULL,
  document VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  timezone VARCHAR(100) DEFAULT 'America/Sao_Paulo',
  active BOOLEAN DEFAULT TRUE,
  setup_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PROFILES TABLE (Tied to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'supervisor', 'operator')),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. MACHINES TABLE
CREATE TABLE IF NOT EXISTS public.machines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(100) NOT NULL,
  sector VARCHAR(100) NOT NULL,
  description TEXT DEFAULT '',
  status VARCHAR(50) DEFAULT 'inactive' CHECK (status IN ('producing', 'stopped', 'setup', 'maintenance', 'inactive')),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (company_id, code)
);

-- 4. PRODUCTS TABLE (No artificial 60 pçs/h defaults)
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(100) NOT NULL,
  description TEXT DEFAULT '',
  target_cycle_time_seconds NUMERIC(10, 2) CHECK (target_cycle_time_seconds IS NULL OR target_cycle_time_seconds > 0),
  target_quantity_per_hour NUMERIC(10, 2) CHECK (target_quantity_per_hour IS NULL OR target_quantity_per_hour > 0),
  target_scrap_percentage NUMERIC(5, 2) CHECK (target_scrap_percentage IS NULL OR (target_scrap_percentage >= 0 AND target_scrap_percentage <= 100)),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (company_id, code)
);

-- 5. SHIFTS TABLE
CREATE TABLE IF NOT EXISTS public.shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  start_time VARCHAR(10) NOT NULL, -- e.g. "06:00"
  end_time VARCHAR(10) NOT NULL,   -- e.g. "14:00" or "06:00" for overnight
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. PRODUCTION ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.production_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code VARCHAR(100) NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  planned_quantity INT NOT NULL CHECK (planned_quantity >= 0),
  produced_quantity INT DEFAULT 0 CHECK (produced_quantity >= 0),
  rejected_quantity INT DEFAULT 0 CHECK (rejected_quantity >= 0 AND rejected_quantity <= produced_quantity),
  start_date TIMESTAMPTZ NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  status VARCHAR(50) DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'paused', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (company_id, code),
  CHECK (start_date <= due_date)
);

-- 7. PRODUCTION RECORDS TABLE
CREATE TABLE IF NOT EXISTS public.production_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  machine_id UUID NOT NULL REFERENCES public.machines(id) ON DELETE RESTRICT,
  operator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  order_id UUID NOT NULL REFERENCES public.production_orders(id) ON DELETE RESTRICT,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  shift_id UUID REFERENCES public.shifts(id) ON DELETE SET NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  produced_quantity INT NOT NULL DEFAULT 0 CHECK (produced_quantity >= 0),
  rejected_quantity INT NOT NULL DEFAULT 0 CHECK (rejected_quantity >= 0 AND rejected_quantity <= produced_quantity),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (end_time IS NULL OR start_time <= end_time)
);

-- 8. DOWNTIME REASONS TABLE
CREATE TABLE IF NOT EXISTS public.downtime_reasons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('setup', 'maintenance', 'material', 'quality', 'operator', 'adjustment', 'electrical', 'mechanical', 'other')),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. DOWNTIME RECORDS TABLE
CREATE TABLE IF NOT EXISTS public.downtime_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  machine_id UUID NOT NULL REFERENCES public.machines(id) ON DELETE RESTRICT,
  operator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  order_id UUID REFERENCES public.production_orders(id) ON DELETE SET NULL,
  reason_id UUID NOT NULL REFERENCES public.downtime_reasons(id) ON DELETE RESTRICT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_seconds INT DEFAULT 0 CHECK (duration_seconds >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (end_time IS NULL OR start_time <= end_time)
);

-- 10. TARGETS TABLE (No artificial defaults, strict unique targets per scope)
CREATE TABLE IF NOT EXISTS public.targets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  machine_id UUID REFERENCES public.machines(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  target_quantity INT CHECK (target_quantity IS NULL OR target_quantity >= 0),
  target_cycle_time_seconds NUMERIC(10, 2) CHECK (target_cycle_time_seconds IS NULL OR target_cycle_time_seconds > 0),
  target_scrap_percentage NUMERIC(5, 2) CHECK (target_scrap_percentage IS NULL OR (target_scrap_percentage >= 0 AND target_scrap_percentage <= 100)),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique indexes to prevent duplicate targets for identical company/machine/product scope (handling NULL combinations)
CREATE UNIQUE INDEX IF NOT EXISTS idx_targets_machine_product ON public.targets (company_id, machine_id, product_id) WHERE machine_id IS NOT NULL AND product_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_targets_machine_only ON public.targets (company_id, machine_id) WHERE machine_id IS NOT NULL AND product_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_targets_product_only ON public.targets (company_id, product_id) WHERE machine_id IS NULL AND product_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_targets_company_only ON public.targets (company_id) WHERE machine_id IS NULL AND product_id IS NULL;

-- 11. API KEYS TABLE (Machine-to-Machine IoT Security - SHA-256 Hashes)
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  key_hash VARCHAR(255) NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

-- 12. AUDIT LOGS TABLE (Append-Only, Historical Preservation without FK CASCADE)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_name VARCHAR(255),
  action VARCHAR(50) NOT NULL CHECK (
    action IN (
      'LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE',
      'START_PRODUCTION', 'REGISTER_PRODUCTION', 'END_PRODUCTION',
      'START_DOWNTIME', 'END_DOWNTIME', 'IMPORT_DATA', 'EXPORT_DATA', 'GENERATE_REPORT'
    )
  ),
  entity_type VARCHAR(100) NOT NULL,
  entity_id VARCHAR(255) NOT NULL,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. ALERTS TABLE
CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('downtime_limit', 'scrap_limit', 'efficiency_low', 'deadline_near')),
  severity VARCHAR(20) DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'danger')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  machine_id UUID REFERENCES public.machines(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.production_orders(id) ON DELETE CASCADE,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES FOR MULTI-TENANT QUERY PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_profiles_company ON public.profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_machines_company ON public.machines(company_id);
CREATE INDEX IF NOT EXISTS idx_products_company ON public.products(company_id);
CREATE INDEX IF NOT EXISTS idx_shifts_company ON public.shifts(company_id);
CREATE INDEX IF NOT EXISTS idx_downtime_reasons_company ON public.downtime_reasons(company_id);
CREATE INDEX IF NOT EXISTS idx_orders_company_status ON public.production_orders(company_id, status);
CREATE INDEX IF NOT EXISTS idx_production_records_company_machine ON public.production_records(company_id, machine_id, start_time);
CREATE INDEX IF NOT EXISTS idx_downtime_records_company_machine ON public.downtime_records(company_id, machine_id, start_time);
CREATE INDEX IF NOT EXISTS idx_targets_company ON public.targets(company_id);
CREATE INDEX IF NOT EXISTS idx_alerts_company ON public.alerts(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_company_time ON public.audit_logs(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_keys_company ON public.api_keys(company_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON public.api_keys(key_hash) WHERE active = TRUE;

-- COMPLETE CROSS-TENANT INTEGRITY CHECK FUNCTION (SECURITY HARDENED WITH SET search_path = public, pg_temp)
CREATE OR REPLACE FUNCTION public.validate_cross_tenant_references()
RETURNS TRIGGER AS $$
BEGIN
  -- 1. production_records
  IF TG_TABLE_NAME = 'production_records' THEN
    IF NEW.machine_id IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM public.machines WHERE id = NEW.machine_id AND company_id = NEW.company_id) THEN
        RAISE EXCEPTION 'CROSS-TENANT VIOLATION: machine_id does not belong to target company';
      END IF;
    END IF;
    IF NEW.operator_id IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.operator_id AND company_id = NEW.company_id) THEN
        RAISE EXCEPTION 'CROSS-TENANT VIOLATION: operator_id does not belong to target company';
      END IF;
    END IF;
    IF NEW.order_id IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM public.production_orders WHERE id = NEW.order_id AND company_id = NEW.company_id) THEN
        RAISE EXCEPTION 'CROSS-TENANT VIOLATION: order_id does not belong to target company';
      END IF;
    END IF;
    IF NEW.product_id IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM public.products WHERE id = NEW.product_id AND company_id = NEW.company_id) THEN
        RAISE EXCEPTION 'CROSS-TENANT VIOLATION: product_id does not belong to target company';
      END IF;
    END IF;
    IF NEW.shift_id IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM public.shifts WHERE id = NEW.shift_id AND company_id = NEW.company_id) THEN
        RAISE EXCEPTION 'CROSS-TENANT VIOLATION: shift_id does not belong to target company';
      END IF;
    END IF;

  -- 2. downtime_records
  ELSIF TG_TABLE_NAME = 'downtime_records' THEN
    IF NEW.machine_id IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM public.machines WHERE id = NEW.machine_id AND company_id = NEW.company_id) THEN
        RAISE EXCEPTION 'CROSS-TENANT VIOLATION: machine_id does not belong to target company';
      END IF;
    END IF;
    IF NEW.operator_id IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.operator_id AND company_id = NEW.company_id) THEN
        RAISE EXCEPTION 'CROSS-TENANT VIOLATION: operator_id does not belong to target company';
      END IF;
    END IF;
    IF NEW.order_id IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM public.production_orders WHERE id = NEW.order_id AND company_id = NEW.company_id) THEN
        RAISE EXCEPTION 'CROSS-TENANT VIOLATION: order_id does not belong to target company';
      END IF;
    END IF;
    IF NEW.reason_id IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM public.downtime_reasons WHERE id = NEW.reason_id AND company_id = NEW.company_id) THEN
        RAISE EXCEPTION 'CROSS-TENANT VIOLATION: reason_id does not belong to target company';
      END IF;
    END IF;

  -- 3. targets
  ELSIF TG_TABLE_NAME = 'targets' THEN
    IF NEW.machine_id IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM public.machines WHERE id = NEW.machine_id AND company_id = NEW.company_id) THEN
        RAISE EXCEPTION 'CROSS-TENANT VIOLATION: machine_id does not belong to target company';
      END IF;
    END IF;
    IF NEW.product_id IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM public.products WHERE id = NEW.product_id AND company_id = NEW.company_id) THEN
        RAISE EXCEPTION 'CROSS-TENANT VIOLATION: product_id does not belong to target company';
      END IF;
    END IF;

  -- 4. alerts
  ELSIF TG_TABLE_NAME = 'alerts' THEN
    IF NEW.machine_id IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM public.machines WHERE id = NEW.machine_id AND company_id = NEW.company_id) THEN
        RAISE EXCEPTION 'CROSS-TENANT VIOLATION: machine_id does not belong to target company';
      END IF;
    END IF;
    IF NEW.order_id IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM public.production_orders WHERE id = NEW.order_id AND company_id = NEW.company_id) THEN
        RAISE EXCEPTION 'CROSS-TENANT VIOLATION: order_id does not belong to target company';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- CREATE TRIGGERS FOR CROSS-TENANT INTEGRITY
DROP TRIGGER IF EXISTS trg_val_production_records ON public.production_records;
CREATE TRIGGER trg_val_production_records
  BEFORE INSERT OR UPDATE ON public.production_records
  FOR EACH ROW EXECUTE FUNCTION public.validate_cross_tenant_references();

DROP TRIGGER IF EXISTS trg_val_downtime_records ON public.downtime_records;
CREATE TRIGGER trg_val_downtime_records
  BEFORE INSERT OR UPDATE ON public.downtime_records
  FOR EACH ROW EXECUTE FUNCTION public.validate_cross_tenant_references();

DROP TRIGGER IF EXISTS trg_val_targets ON public.targets;
CREATE TRIGGER trg_val_targets
  BEFORE INSERT OR UPDATE ON public.targets
  FOR EACH ROW EXECUTE FUNCTION public.validate_cross_tenant_references();

DROP TRIGGER IF EXISTS trg_val_alerts ON public.alerts;
CREATE TRIGGER trg_val_alerts
  BEFORE INSERT OR UPDATE ON public.alerts
  FOR EACH ROW EXECUTE FUNCTION public.validate_cross_tenant_references();

-- RLS HELPER FUNCTIONS (SECURITY HARDENED WITH SET search_path = public, pg_temp)
CREATE OR REPLACE FUNCTION public.get_auth_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION public.get_auth_user_role()
RETURNS VARCHAR AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp;

-- ROW LEVEL SECURITY (RLS) ENFORCEMENT
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.downtime_reasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.downtime_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- 1. COMPANIES RLS
DROP POLICY IF EXISTS "Users can view their company" ON public.companies;
CREATE POLICY "Users can view their company" ON public.companies
  FOR SELECT USING (id = public.get_auth_company_id());

DROP POLICY IF EXISTS "Only Admin can update company" ON public.companies;
CREATE POLICY "Only Admin can update company" ON public.companies
  FOR UPDATE USING (id = public.get_auth_company_id() AND public.get_auth_user_role() = 'admin');

-- 2. PROFILES RLS (Strict ADMIN Management Scoped to Company)
DROP POLICY IF EXISTS "Users can view profiles in their company" ON public.profiles;
CREATE POLICY "Users can view profiles in their company" ON public.profiles
  FOR SELECT USING (company_id = public.get_auth_company_id());

DROP POLICY IF EXISTS "Admin can insert profiles in company" ON public.profiles;
CREATE POLICY "Admin can insert profiles in company" ON public.profiles
  FOR INSERT WITH CHECK (
    company_id = public.get_auth_company_id() AND
    public.get_auth_user_role() = 'admin'
  );

DROP POLICY IF EXISTS "Admin can update profiles in company" ON public.profiles;
CREATE POLICY "Admin can update profiles in company" ON public.profiles
  FOR UPDATE USING (
    company_id = public.get_auth_company_id() AND
    public.get_auth_user_role() = 'admin'
  ) WITH CHECK (
    company_id = public.get_auth_company_id() AND
    public.get_auth_user_role() = 'admin'
  );

DROP POLICY IF EXISTS "Admin can delete profiles in company" ON public.profiles;
CREATE POLICY "Admin can delete profiles in company" ON public.profiles
  FOR DELETE USING (
    company_id = public.get_auth_company_id() AND
    public.get_auth_user_role() = 'admin'
  );

-- 3. MACHINES RLS
DROP POLICY IF EXISTS "Users can view machines in company" ON public.machines;
CREATE POLICY "Users can view machines in company" ON public.machines
  FOR SELECT USING (company_id = public.get_auth_company_id());

DROP POLICY IF EXISTS "Admin/Supervisor can manage machines" ON public.machines;
CREATE POLICY "Admin/Supervisor can manage machines" ON public.machines
  FOR ALL USING (
    company_id = public.get_auth_company_id() AND
    public.get_auth_user_role() IN ('admin', 'supervisor')
  );

-- 4. PRODUCTS RLS
DROP POLICY IF EXISTS "Users can view products in company" ON public.products;
CREATE POLICY "Users can view products in company" ON public.products
  FOR SELECT USING (company_id = public.get_auth_company_id());

DROP POLICY IF EXISTS "Admin/Supervisor can manage products" ON public.products;
CREATE POLICY "Admin/Supervisor can manage products" ON public.products
  FOR ALL USING (
    company_id = public.get_auth_company_id() AND
    public.get_auth_user_role() IN ('admin', 'supervisor')
  );

-- 5. SHIFTS RLS
DROP POLICY IF EXISTS "Users can view shifts in company" ON public.shifts;
CREATE POLICY "Users can view shifts in company" ON public.shifts
  FOR SELECT USING (company_id = public.get_auth_company_id());

DROP POLICY IF EXISTS "Admin/Supervisor can manage shifts" ON public.shifts;
CREATE POLICY "Admin/Supervisor can manage shifts" ON public.shifts
  FOR ALL USING (
    company_id = public.get_auth_company_id() AND
    public.get_auth_user_role() IN ('admin', 'supervisor')
  );

-- 6. PRODUCTION ORDERS RLS
DROP POLICY IF EXISTS "Users can view orders in company" ON public.production_orders;
CREATE POLICY "Users can view orders in company" ON public.production_orders
  FOR SELECT USING (company_id = public.get_auth_company_id());

DROP POLICY IF EXISTS "Admin/Supervisor can manage orders" ON public.production_orders;
CREATE POLICY "Admin/Supervisor can manage orders" ON public.production_orders
  FOR ALL USING (
    company_id = public.get_auth_company_id() AND
    public.get_auth_user_role() IN ('admin', 'supervisor')
  );

-- 7. PRODUCTION RECORDS RLS
DROP POLICY IF EXISTS "Users can view production records in company" ON public.production_records;
CREATE POLICY "Users can view production records in company" ON public.production_records
  FOR SELECT USING (company_id = public.get_auth_company_id());

DROP POLICY IF EXISTS "Operators/Supervisors/Admins can insert production records" ON public.production_records;
CREATE POLICY "Operators/Supervisors/Admins can insert production records" ON public.production_records
  FOR INSERT WITH CHECK (company_id = public.get_auth_company_id());

DROP POLICY IF EXISTS "Supervisors/Admins can update production records" ON public.production_records;
CREATE POLICY "Supervisors/Admins can update production records" ON public.production_records
  FOR UPDATE USING (
    company_id = public.get_auth_company_id() AND
    public.get_auth_user_role() IN ('admin', 'supervisor')
  );

-- 8. DOWNTIME REASONS RLS
DROP POLICY IF EXISTS "Users can view downtime reasons in company" ON public.downtime_reasons;
CREATE POLICY "Users can view downtime reasons in company" ON public.downtime_reasons
  FOR SELECT USING (company_id = public.get_auth_company_id());

DROP POLICY IF EXISTS "Admin/Supervisor can manage downtime reasons" ON public.downtime_reasons;
CREATE POLICY "Admin/Supervisor can manage downtime reasons" ON public.downtime_reasons
  FOR ALL USING (
    company_id = public.get_auth_company_id() AND
    public.get_auth_user_role() IN ('admin', 'supervisor')
  );

-- 9. DOWNTIME RECORDS RLS
DROP POLICY IF EXISTS "Users can view downtime records in company" ON public.downtime_records;
CREATE POLICY "Users can view downtime records in company" ON public.downtime_records
  FOR SELECT USING (company_id = public.get_auth_company_id());

DROP POLICY IF EXISTS "Users can insert downtime records" ON public.downtime_records;
CREATE POLICY "Users can insert downtime records" ON public.downtime_records
  FOR INSERT WITH CHECK (company_id = public.get_auth_company_id());

DROP POLICY IF EXISTS "Users can update downtime records" ON public.downtime_records;
CREATE POLICY "Users can update downtime records" ON public.downtime_records
  FOR UPDATE USING (company_id = public.get_auth_company_id());

-- 10. TARGETS RLS
DROP POLICY IF EXISTS "Users can view targets in company" ON public.targets;
CREATE POLICY "Users can view targets in company" ON public.targets
  FOR SELECT USING (company_id = public.get_auth_company_id());

DROP POLICY IF EXISTS "Admin/Supervisor can manage targets" ON public.targets;
CREATE POLICY "Admin/Supervisor can manage targets" ON public.targets
  FOR ALL USING (
    company_id = public.get_auth_company_id() AND
    public.get_auth_user_role() IN ('admin', 'supervisor')
  );

-- 11. API KEYS RLS (ADMIN-ONLY ACCESS)
DROP POLICY IF EXISTS "Only Admin can view API keys" ON public.api_keys;
CREATE POLICY "Only Admin can view API keys" ON public.api_keys
  FOR SELECT USING (
    company_id = public.get_auth_company_id() AND
    public.get_auth_user_role() = 'admin'
  );

DROP POLICY IF EXISTS "Only Admin can manage API keys" ON public.api_keys;
CREATE POLICY "Only Admin can manage API keys" ON public.api_keys
  FOR ALL USING (
    company_id = public.get_auth_company_id() AND
    public.get_auth_user_role() = 'admin'
  );

-- 12. AUDIT LOGS RLS (APPEND-ONLY VIA SERVER-SIDE SERVICE ROLE ONLY - DIRECT CLIENT INSERT DENIED)
DROP POLICY IF EXISTS "Users can view audit logs in company" ON public.audit_logs;
CREATE POLICY "Users can view audit logs in company" ON public.audit_logs
  FOR SELECT USING (company_id = public.get_auth_company_id());

DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "No insert for regular users on audit logs" ON public.audit_logs;
CREATE POLICY "No insert for regular users on audit logs" ON public.audit_logs FOR INSERT WITH CHECK (false);

DROP POLICY IF EXISTS "No update on audit logs" ON public.audit_logs;
CREATE POLICY "No update on audit logs" ON public.audit_logs FOR UPDATE USING (false);

DROP POLICY IF EXISTS "No delete on audit logs" ON public.audit_logs;
CREATE POLICY "No delete on audit logs" ON public.audit_logs FOR DELETE USING (false);

-- 13. ALERTS RLS (SERVER-SIDE CREATION ONLY VIA SERVICE ROLE)
DROP POLICY IF EXISTS "Users can view alerts in company" ON public.alerts;
CREATE POLICY "Users can view alerts in company" ON public.alerts
  FOR SELECT USING (company_id = public.get_auth_company_id());

DROP POLICY IF EXISTS "Users can update alerts in company" ON public.alerts;
CREATE POLICY "Users can update alerts in company" ON public.alerts
  FOR UPDATE USING (company_id = public.get_auth_company_id());

DROP POLICY IF EXISTS "No insert for regular users on alerts" ON public.alerts;
CREATE POLICY "No insert for regular users on alerts" ON public.alerts FOR INSERT WITH CHECK (false);

DROP POLICY IF EXISTS "No delete on alerts" ON public.alerts;
CREATE POLICY "No delete on alerts" ON public.alerts FOR DELETE USING (false);

-- 14. PLATFORM BOOTSTRAP LOCK TABLE (Infrastructure Singleton Lock for First Tenant Bootstrap)
CREATE TABLE IF NOT EXISTS public.platform_bootstrap_lock (
  id INT PRIMARY KEY CHECK (id = 1),
  locked_at TIMESTAMPTZ DEFAULT NOW(),
  locked_by VARCHAR(255) DEFAULT 'system'
);

-- Seed singleton lock row idempotently
INSERT INTO public.platform_bootstrap_lock (id, locked_by)
VALUES (1, 'initialization')
ON CONFLICT (id) DO NOTHING;

-- RLS Enforcement: Deny all direct client access (Server-Side / Service Role Only)
ALTER TABLE public.platform_bootstrap_lock ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No client access to bootstrap lock table" ON public.platform_bootstrap_lock;
CREATE POLICY "No client access to bootstrap lock table" ON public.platform_bootstrap_lock FOR ALL USING (false);

-- ATOMIC BOOTSTRAP SINGLETON LOCK RPC FUNCTION
-- Atomically locks singleton row (id = 1) FOR UPDATE to serialize concurrent bootstrap attempts
-- and verifies whether an ADMIN profile already exists in public.profiles.
CREATE OR REPLACE FUNCTION public.acquire_bootstrap_lock()
RETURNS BOOLEAN AS $$
DECLARE
  v_admin_exists BOOLEAN;
BEGIN
  -- Perform an exclusive row lock on the singleton bootstrap lock row (FOR UPDATE)
  PERFORM 1 FROM public.platform_bootstrap_lock WHERE id = 1 FOR UPDATE;

  -- Check if an ADMIN profile already exists
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE role = 'admin'
  ) INTO v_admin_exists;

  IF v_admin_exists THEN
    RETURN FALSE; -- Lock rejected: System is already bootstrapped
  END IF;

  RETURN TRUE; -- Lock acquired: First bootstrap execution permitted
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

