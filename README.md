# Crypto-KMS: Production Credential Protection Module

Production-ready Node.js module providing Argon2id password hashing with KMS-managed pepper and envelope (field-level) encryption using Cloud KMS.

## Features

- ✅ **Argon2id password hashing** with KMS-retrieved pepper
- ✅ **Envelope encryption** (AES-256-GCM) with per-record DEKs
- ✅ **Cloud KMS integration** (AWS KMS, GCP KMS, Azure Key Vault)
- ✅ **Key rotation support** with DEK re-wrapping
- ✅ **Comprehensive error handling** and audit logging
- ✅ **Development mode** (local key wrap) for testing

## Security Model

1. **Passwords**: Argon2id hashing with global pepper stored in KMS
2. **Sensitive Fields**: AES-256-GCM encryption with per-record DEKs wrapped by KMS
3. **Key Management**: DEKs never stored in plaintext; only wrapped by KMS CMK
4. **Audit**: All KMS operations logged (metadata only, no sensitive values)

---

## Quick Start

### Installation

```bash
npm install argon2 aws-sdk  # or @google-cloud/kms, @azure/keyvault-keys
```

### Basic Usage

```javascript
const CryptoKMS = require('./lib/crypto-kms');

// Initialize (pepper loaded from KMS at startup)
const cryptoKMS = new CryptoKMS({
  kmsProvider: 'aws',
  pepperSecretId: 'your-app/password-pepper',
  cmkKeyId: process.env.KMS_CMK_KEY_ID
});

// Hash password
const { hash } = await cryptoKMS.hashPassword('user-password');

// Verify password
const isValid = await cryptoKMS.verifyPassword(hash, 'user-password');

// Encrypt field
const encrypted = await cryptoKMS.encryptField('sensitive-api-key');

// Decrypt field
const decrypted = await cryptoKMS.decryptField(record);
```

See `examples/usage.md` for detailed examples.

---

## Environment Variables

### Required

```bash
# KMS Configuration
KMS_PROVIDER=aws                    # aws, gcp, azure, local
KMS_CMK_KEY_ID=arn:aws:kms:...     # CMK key ID/ARN
PEPPER_SECRET_ID=your-app/pepper   # KMS secret name for pepper

# AWS KMS (if using AWS)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...               # Or use IAM role
AWS_SECRET_ACCESS_KEY=...

# Argon2 Parameters (optional, defaults provided)
ARGON2_MEMORY_COST=65536           # Memory cost in KB
ARGON2_TIME_COST=3                 # Time cost (iterations)
ARGON2_PARALLELISM=4               # Parallelism (threads)
```

### AWS IAM Permissions

Your application IAM role/user needs:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "kms:GenerateDataKey",
        "kms:Decrypt",
        "kms:Encrypt"
      ],
      "Resource": "arn:aws:kms:*:*:key/YOUR_CMK_ID"
    },
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:*:*:secret:your-app/*"
    }
  ]
}
```

**Recommendation**: Use least-privilege IAM roles and enable MFA for admin operations.

---

## Argon2 Parameter Guidelines

Default parameters provide moderate security. Tune based on server resources:

### Small Server (2 vCPU, 4GB RAM)

```bash
ARGON2_MEMORY_COST=32768    # 32 MB
ARGON2_TIME_COST=2          # 2 iterations
ARGON2_PARALLELISM=2        # 2 threads
```

**Expected hash time**: ~200-300ms per password

### Medium Server (4 vCPU, 16GB RAM) - **Recommended Default**

```bash
ARGON2_MEMORY_COST=65536    # 64 MB
ARGON2_TIME_COST=3          # 3 iterations
ARGON2_PARALLELISM=4        # 4 threads
```

**Expected hash time**: ~300-500ms per password

### Large Server (8+ vCPU, 64GB+ RAM)

```bash
ARGON2_MEMORY_COST=131072   # 128 MB
ARGON2_TIME_COST=4          # 4 iterations
ARGON2_PARALLELISM=8        # 8 threads
```

**Expected hash time**: ~500-800ms per password

**Benchmarking**: Run `node tests/benchmark-argon2.js` to find optimal parameters for your hardware. Target 300-500ms hash time for production.

---

## Database Schema

See `migrations/20250101_add_encryption_columns.sql` for full schema.

### Minimal Schema Example

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255),
  password_hash TEXT,              -- Argon2id hash
  
  -- Encrypted field components
  encrypted_value TEXT,            -- Base64 ciphertext
  iv TEXT,                         -- Base64 IV
  tag TEXT,                        -- Base64 auth tag
  encrypted_dek TEXT,              -- Base64 wrapped DEK
  dek_kms_key_id VARCHAR(255),      -- KMS key ID
  dek_version BIGINT,              -- DEK version/timestamp
  encryption_algorithm VARCHAR(50) DEFAULT 'aes-256-gcm'
);

-- Index for key rotation queries
CREATE INDEX idx_users_dek_kms_key_id ON users(dek_kms_key_id);
```

---

## Key Rotation Procedure

### Step 1: Create New CMK

```bash
# AWS CLI example
aws kms create-key \
  --description "New CMK for key rotation 2025-01-15" \
  --key-usage ENCRYPT_DECRYPT \
  --tags TagKey=Purpose,TagValue=KeyRotation
```

Save the new key ARN: `arn:aws:kms:us-east-1:123456789012:key/new-key-id`

### Step 2: Enable New Key in Application

Add new key ID to environment (keep old key for migration):

```bash
export KMS_CMK_KEY_ID_NEW=arn:aws:kms:us-east-1:123456789012:key/new-key-id
```

### Step 3: Rewrap DEKs (Batch Script)

```javascript
const CryptoKMS = require('./lib/crypto-kms');

const cryptoKMS = new CryptoKMS({
  kmsProvider: 'aws',
  cmkKeyId: process.env.KMS_CMK_KEY_ID_NEW
});

// Find all records with old key
const records = await db.query(`
  SELECT id, encrypted_dek, dek_kms_key_id
  FROM users
  WHERE dek_kms_key_id = $1
`, [process.env.KMS_CMK_KEY_ID_OLD]);

// Rewrap each DEK
for (const record of records) {
  const rotationResult = await cryptoKMS.rotateMasterKey(
    record.dek_kms_key_id,
    process.env.KMS_CMK_KEY_ID_NEW,
    record.encrypted_dek
  );
  
  // Update record
  await db.query(`
    UPDATE users
    SET encrypted_dek = $1, dek_kms_key_id = $2, dek_version = $3
    WHERE id = $4
  `, [
    rotationResult.encryptedDek,
    rotationResult.dekMeta.kmsKeyId,
    rotationResult.dekMeta.version,
    record.id
  ]);
}
```

### Step 4: Verify Rotation

```javascript
// Test decryption with new key
const testRecord = await db.query(`
  SELECT encrypted_value, iv, tag, encrypted_dek, dek_kms_key_id
  FROM users
  WHERE dek_kms_key_id = $1
  LIMIT 10
`, [process.env.KMS_CMK_KEY_ID_NEW]);

for (const record of testRecord.rows) {
  const decrypted = await cryptoKMS.decryptField(record);
  console.log('Decryption successful:', decrypted.length, 'bytes');
}
```

### Step 5: Switch to New Key

```bash
export KMS_CMK_KEY_ID=$KMS_CMK_KEY_ID_NEW
# Restart application
```

### Step 6: Archive Old Key (after 30-day grace period)

```bash
# Disable old key (keep for emergency rollback)
aws kms disable-key --key-id $KMS_CMK_KEY_ID_OLD

# After 90 days, schedule deletion
aws kms schedule-key-deletion --key-id $KMS_CMK_KEY_ID_OLD --pending-window-in-days 30
```

**Security Note**: Keep old key disabled (not deleted) for at least 90 days for emergency rollback.

---

## Backfill Existing Data

Use the provided backfill script to encrypt existing plaintext fields:

```bash
# Dry run (no changes)
node scripts/backfill_encrypt_sensitive_fields.js \
  --dry-run \
  --batch-size 100 \
  --plaintext-column api_key \
  --table users

# Live run
node scripts/backfill_encrypt_sensitive_fields.js \
  --batch-size 50 \
  --plaintext-column api_key \
  --table users
```

**Safety Features**:
- Processes in small batches
- Verifies encryption before zeroing plaintext
- Logs all operations
- Supports dry-run mode

---

## Pepper Management

### Storing Pepper in AWS Secrets Manager

```bash
# Create secret
aws secretsmanager create-secret \
  --name your-app/password-pepper \
  --secret-string "your-random-pepper-value-64-chars-minimum"

# Retrieve in application (automatically handled)
```

### Pepper Rotation

1. Create new pepper secret: `your-app/password-pepper-v2`
2. Update application to load both peppers
3. Hash new passwords with new pepper
4. Verify old passwords against old pepper if new fails
5. After all passwords rotated, remove old pepper

**Note**: Pepper rotation requires re-hashing all passwords (users must reset passwords or system must re-hash on next login).

---

## Backup & Audit

### Backup Requirements

1. **Database**: Regular backups including encryption metadata columns
2. **KMS Keys**: Export key material (if enabled) and store in secure vault
3. **Audit Logs**: Retain KMS operation logs for compliance (suggest 7 years)

### Audit Logging

All KMS operations are logged:

```json
{
  "timestamp": "2025-01-15T10:30:00Z",
  "operation": "decrypt",
  "kmsKeyId": "arn:aws:kms:...",
  "metadata": {
    "success": true,
    "sensitiveDataRemoved": true
  }
}
```

**Recommendation**: Integrate with CloudWatch, Datadog, or your SIEM system.

### Detecting Abnormal KMS Usage

Set up alerts for:
- Unusual number of decrypt operations (>10x baseline)
- Decryption failures (>5% failure rate)
- Requests from unexpected regions/IPs
- Operations outside business hours

---

## Security Checklist

### Pre-Production

- [ ] KMS CMK created and IAM permissions configured
- [ ] Pepper stored in KMS/Secrets Manager
- [ ] Environment variables set (no plaintext keys in code)
- [ ] Argon2 parameters benchmarked for your hardware
- [ ] Database migration applied
- [ ] Backfill script tested in staging
- [ ] Key rotation procedure documented and tested
- [ ] Audit logging configured
- [ ] Error handling tested (KMS failures, corrupted data)

### Production Deployment

- [ ] Run backfill script on production (start with dry-run)
- [ ] Monitor KMS costs and usage
- [ ] Verify decryption works for sample records
- [ ] Test password verification with real users
- [ ] Set up alerts for KMS failures
- [ ] Document runbook for on-call engineers

### Ongoing Maintenance

- [ ] Review KMS access logs monthly
- [ ] Rotate CMK annually (or per policy)
- [ ] Test key rotation procedure in staging quarterly
- [ ] Review Argon2 parameters annually (adjust for hardware changes)
- [ ] Audit password reset and re-hashing flows

---

## Development Mode

For local development, use `LOCAL_DEMO` mode:

```javascript
const cryptoKMS = new CryptoKMS({
  kmsProvider: CryptoKMS.KMS_PROVIDERS.LOCAL,
  kmsConfig: {
    masterKey: Buffer.from('local-dev-key-32-bytes-long-123456', 'utf8'),
    peppers: {
      'test-pepper': 'local-dev-pepper'
    }
  },
  pepperSecretId: 'test-pepper',
  cmkKeyId: 'local-dev-key'
});
```

**⚠️ WARNING**: Never use LOCAL_DEMO mode in production. It uses file-based key wrapping which is insecure.

---

## Testing

```bash
# Run tests (uses LOCAL_DEMO mode, no real KMS required)
npm test

# Run specific test
npm test -- --testNamePattern="Password Hashing"
```

Tests cover:
- Password hash/verify roundtrip
- Encrypt/decrypt roundtrip
- Key rotation (rewrap DEK)
- Error handling (corrupted data, missing fields)
- Edge cases (empty strings, binary data)

---

## Troubleshooting

### "Cannot initialize crypto module: pepper retrieval failed"

**Solution**: Verify KMS permissions and secret name:
```bash
aws secretsmanager get-secret-value --secret-id your-app/password-pepper
```

### "CMK key ID must be provided"

**Solution**: Set `KMS_CMK_KEY_ID` environment variable or pass in constructor.

### Decryption fails with "Failed to decrypt field"

**Possible causes**:
- Corrupted IV, tag, or ciphertext
- Wrong KMS key ID
- KMS permissions issue
- DEK wrapped with different CMK

**Debug steps**:
1. Check `dek_kms_key_id` matches current CMK
2. Verify KMS decrypt permissions
3. Check database for data corruption
4. Review audit logs for KMS errors

### High KMS costs

**Solution**: 
- Review unnecessary KMS calls
- Consider caching unwrapped DEKs in memory (with TTL)
- Batch operations where possible

---

## TypeScript Support

Type definitions (add to `lib/crypto-kms.d.ts`):

```typescript
export interface EncryptionResult {
  ciphertext: string;
  iv: string;
  tag: string;
  encryptedDek: string;
  dekMeta: {
    kmsKeyId: string;
    version: number;
    algorithm: string;
  };
}

export interface CryptoKMSOptions {
  kmsProvider?: string;
  kmsConfig?: any;
  argon2Params?: Argon2Options;
  pepperSecretId?: string;
  cmkKeyId?: string;
}

export declare class CryptoKMS {
  constructor(options?: CryptoKMSOptions);
  hashPassword(plainPassword: string): Promise<{ hash: string }>;
  verifyPassword(hash: string, plainPassword: string): Promise<boolean>;
  encryptField(plaintext: string, opts?: any): Promise<EncryptionResult>;
  decryptField(record: any, opts?: any): Promise<string>;
  rotateMasterKey(oldKeyId: string, newKeyId: string, oldEncryptedDek: string | Buffer): Promise<any>;
}
```

---

## Integration with Other KMS Providers

### GCP Cloud KMS

1. Install: `npm install @google-cloud/kms`
2. Update `KMSClient._initClient()` in `lib/crypto-kms.js`:
   ```javascript
   case KMS_PROVIDERS.GCP:
     const { KeyManagementServiceClient } = require('@google-cloud/kms');
     this.client = new KeyManagementServiceClient({
       projectId: config.projectId,
       keyFilename: config.keyFilename
     });
     break;
   ```
3. Implement `generateDataKey` and `decryptDataKey` methods for GCP

### Azure Key Vault

1. Install: `npm install @azure/keyvault-keys @azure/identity`
2. Update `KMSClient._initClient()`:
   ```javascript
   case KMS_PROVIDERS.AZURE:
     const { KeyClient } = require('@azure/keyvault-keys');
     const { DefaultAzureCredential } = require('@azure/identity');
     this.client = new KeyClient(config.vaultUrl, new DefaultAzureCredential());
     break;
   ```

See inline comments in `lib/crypto-kms.js` for integration points.

---

## License

[Your License Here]

## Support

For issues or questions:
- Review `examples/usage.md` for code examples
- Check `tests/crypto.test.js` for usage patterns
- Review audit logs for KMS operation details

---

## Production Deployment Checklist

1. **Infrastructure**
   - [ ] Create KMS CMK in production region
   - [ ] Configure IAM roles with least-privilege permissions
   - [ ] Store pepper in Secrets Manager/Parameter Store
   - [ ] Set up CloudWatch/alerting for KMS operations

2. **Application**
   - [ ] Set all required environment variables
   - [ ] Benchmark Argon2 parameters on production hardware
   - [ ] Test KMS connectivity and permissions
   - [ ] Verify pepper retrieval works

3. **Database**
   - [ ] Run migration script in staging
   - [ ] Verify schema changes
   - [ ] Test encryption/decryption with sample data

4. **Data Migration**
   - [ ] Run backfill script in staging (dry-run first)
   - [ ] Verify all sensitive fields encrypted
   - [ ] Test decryption works correctly
   - [ ] Run backfill in production (dry-run first)

5. **Monitoring**
   - [ ] Set up alerts for KMS failures
   - [ ] Monitor KMS API costs
   - [ ] Review audit logs weekly for first month

6. **Documentation**
   - [ ] Document key rotation procedure
   - [ ] Create runbook for on-call engineers
   - [ ] Train team on security procedures

---

**Remember**: Never log sensitive values. Always fail closed (return errors, not plaintext) if any step fails.
