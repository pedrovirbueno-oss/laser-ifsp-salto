import crypto from 'crypto';

export interface GeneratedApiKey {
  rawKey: string;
  keyHash: string;
}

/**
 * Generates a high-entropy cryptographic API key and its SHA-256 hash.
 * Format: nexo_live_<32_random_bytes_hex>
 */
export function generateApiKey(): GeneratedApiKey {
  const randomBytes = crypto.randomBytes(32).toString('hex');
  const rawKey = `nexo_live_${randomBytes}`;
  const keyHash = hashApiKey(rawKey);
  return { rawKey, keyHash };
}

/**
 * Computes the SHA-256 hash of a raw API key.
 */
export function hashApiKey(rawKey: string): string {
  if (!rawKey) return '';
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}
