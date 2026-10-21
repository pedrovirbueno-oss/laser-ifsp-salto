export type UserRole = 'admin' | 'supervisor' | 'operator';

export interface Company {
  id: string;
  name: string;
  legal_name: string;
  document: string;
  email: string;
  phone: string;
  timezone: string;
  active: boolean;
  setup_completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  company_id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export type MachineStatus = 'producing' | 'stopped' | 'setup' | 'maintenance' | 'inactive';

export interface Machine {
  id: string;
  company_id: string;
  name: string;
  code: string;
  sector: string;
  description: string;
  status: MachineStatus;
  current_operator_id?: string;
  current_operator_name?: string;
  current_order_id?: string;
  current_order_code?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  company_id: string;
  name: string;
  code: string;
  description: string;
  target_cycle_time_seconds?: number;
  target_quantity_per_hour?: number;
  target_scrap_percentage?: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Shift {
  id: string;
  company_id: string;
  name: string;
  start_time: string; // "06:00"
  end_time: string;   // "14:00"
  active: boolean;
}

export type OrderStatus = 'planned' | 'active' | 'paused' | 'completed' | 'cancelled';

export interface ProductionOrder {
  id: string;
  company_id: string;
  code: string;
  product_id: string;
  product_name?: string;
  planned_quantity: number;
  produced_quantity: number; // Total produced
  rejected_quantity: number; // Scrap
  good_quantity?: number;    // Computed Total - Scrap
  start_date: string;
  due_date: string;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
}

export interface ProductionRecord {
  id: string;
  company_id: string;
  machine_id: string;
  machine_name?: string;
  operator_id: string;
  operator_name?: string;
  order_id: string;
  order_code?: string;
  product_id: string;
  product_name?: string;
  shift_id: string;
  shift_name?: string;
  start_time: string;
  end_time?: string;
  produced_quantity: number; // Total
  rejected_quantity: number; // Scrap
  good_quantity?: number;    // Computed Virtual Domain Property (Produced - Rejected)
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type DowntimeCategory = 
  | 'setup' 
  | 'maintenance' 
  | 'material' 
  | 'quality' 
  | 'operator' 
  | 'adjustment' 
  | 'electrical' 
  | 'mechanical' 
  | 'other';

export interface DowntimeReason {
  id: string;
  company_id: string;
  name: string;
  category: DowntimeCategory;
  active: boolean;
  created_at: string;
}

export interface DowntimeRecord {
  id: string;
  company_id: string;
  machine_id: string;
  machine_name?: string;
  operator_id: string;
  operator_name?: string;
  order_id: string;
  order_code?: string;
  reason_id: string;
  reason_name?: string;
  category?: DowntimeCategory;
  start_time: string;
  end_time?: string;
  duration_seconds: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface MachineEvent {
  id: string;
  machine_id: string;
  timestamp: string;
  type: 'status_change' | 'production_start' | 'production_end' | 'downtime_start' | 'downtime_end' | 'scrap_recorded';
  title: string;
  description: string;
  status: MachineStatus;
  operator_name?: string;
  order_code?: string;
}

export interface Target {
  id: string;
  company_id: string;
  machine_id?: string;
  product_id?: string;
  target_quantity?: number;
  target_cycle_time_seconds?: number;
  target_scrap_percentage?: number;
  created_at: string;
  updated_at: string;
}

export type AuditAction = 
  | 'LOGIN' 
  | 'LOGOUT' 
  | 'CREATE' 
  | 'UPDATE' 
  | 'DELETE' 
  | 'START_PRODUCTION' 
  | 'REGISTER_PRODUCTION' 
  | 'END_PRODUCTION' 
  | 'START_DOWNTIME' 
  | 'END_DOWNTIME' 
  | 'IMPORT_DATA' 
  | 'EXPORT_DATA' 
  | 'GENERATE_REPORT';

export interface AuditLog {
  id: string;
  company_id: string;
  user_id: string;
  user_name?: string;
  action: AuditAction;
  entity_type: string;
  entity_id: string;
  old_data?: Record<string, any> | null;
  new_data?: Record<string, any> | null;
  created_at: string;
}

export interface Alert {
  id: string;
  company_id: string;
  type: 'downtime_limit' | 'scrap_limit' | 'efficiency_low' | 'deadline_near';
  severity: 'info' | 'warning' | 'danger';
  title: string;
  message: string;
  machine_id?: string;
  order_id?: string;
  read: boolean;
  created_at: string;
}

export interface OeeMetrics {
  availability: number; // percentage 0 - 100
  performance: number;  // percentage 0 - 100
  quality: number;      // percentage 0 - 100
  oee: number;          // percentage 0 - 100
  plannedTimeMinutes: number;
  downtimeMinutes: number;
  runTimeMinutes: number;
  totalCount: number;
  scrapCount: number;
  goodCount: number;
  timeWindow: string;   // e.g. "Últimos 30 dias"
  sufficientData: boolean;
}

export interface TelemetryPayload {
  machine_code: string;
  timestamp: string;
  signals: {
    running: boolean;
    cycle_count: number;
    speed_rpm?: number;
    temperature_c?: number;
  };
}

export interface ApiKey {
  id: string;
  company_id: string;
  name: string;
  key_hash: string;
  active: boolean;
  created_at: string;
  last_used_at?: string;
}

export interface SetupState {
  company: {
    name: string;
    legal_name: string;
    document: string;
    email: string;
    phone: string;
    timezone: string;
  };
  machines: Array<{
    name: string;
    code: string;
    sector: string;
    description: string;
  }>;
  products: Array<{
    name: string;
    code: string;
    description: string;
    target_cycle_time_seconds: number;
    target_quantity_per_hour: number;
    target_scrap_percentage: number;
  }>;
  shifts: Array<{
    name: string;
    start_time: string;
    end_time: string;
  }>;
  downtime_reasons: Array<{
    name: string;
    category: DowntimeCategory;
    active: boolean;
  }>;
  operator: {
    name: string;
    email: string;
  };
  currentStep: number;
  completed: boolean;
}

