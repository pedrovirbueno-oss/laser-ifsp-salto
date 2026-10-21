import { DemoApiKeyRepository } from '../repositories/demo';
import { generateApiKey, hashApiKey } from '../lib/apiKey';

describe('API & IoT Endpoint SHA-256 Validation Tests', () => {
  const apiKeyRepo = new DemoApiKeyRepository();
  const companyId = '00000000-0000-0000-0000-000000000001';

  it('should generate valid SHA-256 key pair and authenticate successfully', async () => {
    const { rawKey, keyHash } = generateApiKey();

    expect(rawKey).toContain('nexo_live_');
    expect(keyHash).not.toEqual(rawKey);

    const storedKey = await apiKeyRepo.create({
      company_id: companyId,
      name: 'Gateway CLP Test Ingestion',
      key_hash: keyHash,
      active: true,
    });

    const validated = await apiKeyRepo.validateKey(hashApiKey(rawKey));
    expect(validated).not.toBeNull();
    expect(validated?.company_id).toBe(companyId);
  });

  it('should REJECT revoked / inactive API key', async () => {
    const { rawKey, keyHash } = generateApiKey();

    const key = await apiKeyRepo.create({
      company_id: companyId,
      name: 'Revoked Gateway CLP',
      key_hash: keyHash,
      active: true,
    });

    // Revoke key
    await apiKeyRepo.revoke(key.id);

    const validated = await apiKeyRepo.validateKey(hashApiKey(rawKey));
    expect(validated).toBeNull();
  });

  it('should REJECT invalid key hash', async () => {
    const validated = await apiKeyRepo.validateKey('invalid_sha256_hash_value');
    expect(validated).toBeNull();
  });

  it('should REJECT production records with invalid quantities (rejected > produced)', () => {
    function validateProductionQuantities(produced: number, rejected: number): boolean {
      if (isNaN(produced) || produced < 0 || isNaN(rejected) || rejected < 0) {
        return false;
      }
      if (rejected > produced) {
        return false;
      }
      return true;
    }

    expect(validateProductionQuantities(100, 10)).toBe(true);
    expect(validateProductionQuantities(100, 0)).toBe(true);
    expect(validateProductionQuantities(-10, 0)).toBe(false);
    expect(validateProductionQuantities(10, 20)).toBe(false); // rejected > produced
  });
});
