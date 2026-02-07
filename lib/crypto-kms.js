// lib/crypto-kms.js
/**
 * Crypto-KMS: Production Credential Protection Module
 * Provides Argon2id password hashing with KMS-managed pepper and envelope encryption
 */

const crypto = require('crypto');
const argon2 = require('argon2');

/**
 * KMS Provider Types
 */
const KMS_PROVIDERS = {
  LOCAL: 'local',
  AWS: 'aws',
  GCP: 'gcp',
  AZURE: 'azure'
};

/**
 * Local KMS Client (for testing/development)
 */
class LocalKMSClient {
  constructor(config = {}) {
    this.masterKey = config.masterKey || crypto.randomBytes(32);
    this.peppers = config.peppers || {};
  }

  async encryptDataKey(plaintextDek, keyId) {
    // Simple local encryption using master key
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.masterKey, iv);
    const encrypted = Buffer.concat([cipher.update(plaintextDek), cipher.final()]);
    const tag = cipher.getAuthTag();
    // Store IV with encrypted data for decryption
    return Buffer.concat([iv, encrypted, tag]);
  }

  async decryptDataKey(encryptedDek, keyId) {
    // Extract IV, encrypted data, and tag
    const iv = encryptedDek.slice(0, 12);
    const tag = encryptedDek.slice(-16);
    const encrypted = encryptedDek.slice(12, -16);
    const decipher = crypto.createDecipheriv('aes-256-gcm', this.masterKey, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]);
  }

  async getSecret(secretId) {
    if (this.peppers[secretId]) {
      return this.peppers[secretId];
    }
    throw new Error(`Secret ${secretId} not found in local config`);
  }
}

/**
 * CryptoKMS Class
 */
class CryptoKMS {
  static KMS_PROVIDERS = KMS_PROVIDERS;

  constructor(options = {}) {
    const {
      kmsProvider = KMS_PROVIDERS.LOCAL,
      kmsConfig = {},
      pepperSecretId,
      cmkKeyId,
      argon2Params = {}
    } = options;

    this.pepperSecretId = pepperSecretId || null;
    this.cmkKeyId = cmkKeyId || null;
    this.argon2Params = {
      type: argon2Params.type || argon2.argon2id,
      memoryCost: argon2Params.memoryCost || 16384,
      timeCost: argon2Params.timeCost || 3,
      parallelism: argon2Params.parallelism || 4
    };

    // Initialize KMS client
    if (kmsProvider === KMS_PROVIDERS.LOCAL) {
      this.kmsClient = new LocalKMSClient(kmsConfig);
    } else {
      // For other providers, would initialize AWS/GCP/Azure clients
      // For now, fallback to local
      this.kmsClient = new LocalKMSClient(kmsConfig);
    }

    this.pepperCache = null;

    // Load pepper if secret ID provided
    if (this.pepperSecretId) {
      this.loadPepper().catch(err => {
        console.warn('Failed to load pepper at startup:', err);
      });
    }
  }

  /**
   * Load pepper from KMS
   */
  async loadPepper() {
    if (!this.pepperSecretId) {
      throw new Error('Pepper secret ID not configured');
    }
    this.pepperCache = await this.kmsClient.getSecret(this.pepperSecretId);
  }

  /**
   * Get pepper (load if not cached)
   */
  async getPepper() {
    if (this.pepperCache) {
      return this.pepperCache;
    }
    if (this.pepperSecretId) {
      await this.loadPepper();
      return this.pepperCache;
    }
    return ''; // No pepper if not configured
  }

  /**
   * Hash password with Argon2id + pepper
   */
  async hashPassword(plainPassword) {
    if (!plainPassword || plainPassword.length === 0) {
      throw new Error('Password cannot be empty');
    }

    const pepper = await this.getPepper();
    const passwordWithPepper = plainPassword + pepper;

    const hash = await argon2.hash(passwordWithPepper, this.argon2Params);
    return { hash };
  }

  /**
   * Verify password against hash
   */
  async verifyPassword(hash, plainPassword) {
    if (!hash || !plainPassword) {
      return false;
    }

    try {
      const pepper = await this.getPepper();
      const passwordWithPepper = plainPassword + pepper;
      return await argon2.verify(hash, passwordWithPepper);
    } catch (error) {
      return false;
    }
  }

  /**
   * Encrypt a field using envelope encryption
   */
  async encryptField(plaintext, options = {}) {
    if (!plaintext || plaintext.length === 0) {
      throw new Error('Plaintext cannot be empty');
    }

    if (!this.cmkKeyId) {
      throw new Error('CMK key ID must be provided');
    }

    let dek;
    let encryptedDek;
    let dekVersion = 1;

    // Use existing DEK if provided
    if (options.existingEncryptedDek && options.existingDekKmsKeyId) {
      encryptedDek = Buffer.from(options.existingEncryptedDek, 'base64');
      dekVersion = options.existingDekVersion || 1;
      dek = await this.kmsClient.decryptDataKey(encryptedDek, options.existingDekKmsKeyId);
    } else {
      // Generate new DEK
      dek = crypto.randomBytes(32); // AES-256 key
      encryptedDek = await this.kmsClient.encryptDataKey(dek, this.cmkKeyId);
    }

    // Encrypt plaintext with DEK
    const iv = crypto.randomBytes(12); // GCM IV
    const cipher = crypto.createCipheriv('aes-256-gcm', dek, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();

    return {
      ciphertext: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      tag: tag.toString('base64'),
      encryptedDek: encryptedDek.toString('base64'),
      dekMeta: {
        kmsKeyId: this.cmkKeyId,
        version: dekVersion,
        algorithm: 'aes-256-gcm'
      }
    };
  }

  /**
   * Decrypt a field
   */
  async decryptField(record, options = {}) {
    const ciphertextField = options.ciphertextField || 'encrypted_value';
    const ivField = options.ivField || 'iv';
    const tagField = options.tagField || 'tag';
    const encryptedDekField = options.encryptedDekField || 'encrypted_dek';

    const ciphertext = record[ciphertextField];
    const iv = record[ivField];
    const tag = record[tagField];
    const encryptedDek = record[encryptedDekField];
    const kmsKeyId = record.dek_kms_key_id || this.cmkKeyId;

    if (!ciphertext || !iv || !tag || !encryptedDek || !kmsKeyId) {
      throw new Error('Missing required encryption fields');
    }

    try {
      // Decrypt DEK
      const encryptedDekBuffer = Buffer.from(encryptedDek, 'base64');
      const dek = await this.kmsClient.decryptDataKey(encryptedDekBuffer, kmsKeyId);

      // Decrypt plaintext
      const ivBuffer = Buffer.from(iv, 'base64');
      const tagBuffer = Buffer.from(tag, 'base64');
      const ciphertextBuffer = Buffer.from(ciphertext, 'base64');

      const decipher = crypto.createDecipheriv('aes-256-gcm', dek, ivBuffer);
      decipher.setAuthTag(tagBuffer);
      const decrypted = Buffer.concat([decipher.update(ciphertextBuffer), decipher.final()]);

      return decrypted.toString('utf8');
    } catch (error) {
      throw new Error(`Failed to decrypt field: ${error.message}`);
    }
  }

  /**
   * Rotate master key (re-wrap DEK)
   */
  async rotateMasterKey(oldKeyId, newKeyId, oldEncryptedDek) {
    if (!oldKeyId || !newKeyId || !oldEncryptedDek) {
      throw new Error('All parameters required for key rotation');
    }

    const encryptedDekBuffer = typeof oldEncryptedDek === 'string'
      ? Buffer.from(oldEncryptedDek, 'base64')
      : oldEncryptedDek;

    // Decrypt with old key
    const dek = await this.kmsClient.decryptDataKey(encryptedDekBuffer, oldKeyId);

    // Re-encrypt with new key
    const newEncryptedDek = await this.kmsClient.encryptDataKey(dek, newKeyId);

    return {
      encryptedDek: newEncryptedDek.toString('base64'),
      dekMeta: {
        kmsKeyId: newKeyId,
        version: 1,
        algorithm: 'aes-256-gcm'
      }
    };
  }
}

// Export
module.exports = CryptoKMS;
module.exports.KMS_PROVIDERS = KMS_PROVIDERS;


