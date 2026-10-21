# NEXO Production — Database Schema & Security Specification

## Schema Design

### Core Tables
1. **companies**: `id`, `name`, `legal_name`, `document`, `email`, `phone`, `timezone`, `active`.
2. **profiles**: `id` (references `auth.users`), `company_id`, `name`, `email`, `role`, `active`.
3. **machines**: `id`, `company_id`, `name`, `code`, `sector`, `description`, `status`, `active`.
4. **products**: `id`, `company_id`, `name`, `code`, `target_cycle_time_seconds`, `target_quantity_per_hour`, `target_scrap_percentage`, `active`.
5. **shifts**: `id`, `company_id`, `name`, `start_time`, `end_time`, `active`. Supports overnight shifts crossing midnight (e.g. `22:00` - `06:00`).
6. **production_orders**: `id`, `company_id`, `code`, `product_id`, `planned_quantity`, `produced_quantity`, `rejected_quantity`, `start_date`, `due_date`, `status`.
7. **production_records**: `id`, `company_id`, `machine_id`, `operator_id`, `order_id`, `product_id`, `shift_id`, `start_time`, `end_time`, `produced_quantity`, `rejected_quantity`, `good_quantity`, `notes`.
8. **downtime_reasons**: `id`, `company_id`, `name`, `category`, `active`.
9. **downtime_records**: `id`, `company_id`, `machine_id`, `operator_id`, `order_id`, `reason_id`, `start_time`, `end_time`, `duration_seconds`, `notes`.
10. **api_keys**: `id`, `company_id`, `name`, `key_hash`, `active`, `last_used_at`.
11. **audit_logs**: Append-only log table storing canonical English audit actions (`LOGIN`, `LOGOUT`, `CREATE`, `UPDATE`, `DELETE`, `START_PRODUCTION`, `REGISTER_PRODUCTION`, `END_PRODUCTION`, `START_DOWNTIME`, `END_DOWNTIME`, `IMPORT_DATA`, `EXPORT_DATA`, `GENERATE_REPORT`).
