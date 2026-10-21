import { AuditAction, AuditLog } from '@/types';

/**
 * Creates a structured audit log entry payload.
 * Sanitizes input to ensure passwords, secrets, or tokens are never logged.
 */
export function createAuditLogEntry(
  companyId: string,
  userId: string,
  userName: string,
  action: AuditAction,
  entityType: string,
  entityId: string,
  oldData?: Record<string, any> | null,
  newData?: Record<string, any> | null
): AuditLog {
  const sanitize = (obj?: Record<string, any> | null) => {
    if (!obj) return null;
    const sanitized = { ...obj };
    delete sanitized.password;
    delete sanitized.secret;
    delete sanitized.token;
    delete sanitized.key_hash;
    return sanitized;
  };

  return {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    company_id: companyId,
    user_id: userId,
    user_name: userName,
    action,
    entity_type: entityType,
    entity_id: entityId,
    old_data: sanitize(oldData),
    new_data: sanitize(newData),
    created_at: new Date().toISOString(),
  };
}
