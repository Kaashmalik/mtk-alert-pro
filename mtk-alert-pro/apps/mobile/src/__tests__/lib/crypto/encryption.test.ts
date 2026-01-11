/**
 * Encryption Utility Tests
 * 
 * @jest-environment node
 */

import {
  encryptPassword,
  decryptPassword,
  hashString,
  generateRandomKey,
  isEncrypted,
} from '@/lib/crypto/encryption';

describe('Encryption Utility', () => {
  // =========================================================================
  // encryptPassword
  // =========================================================================
  describe('encryptPassword', () => {
    it('should encrypt a password with salt', () => {
      const password = 'mySecretPassword123';
      const salt = 'user-id-12345';
      
      const encrypted = encryptPassword(password, salt);
      
      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');
      expect(encrypted).not.toBe(password);
      expect(encrypted.length).toBeGreaterThan(0);
    });

    it('should produce different ciphertext for same password with different salts', () => {
      const password = 'samePassword';
      const salt1 = 'salt-1';
      const salt2 = 'salt-2';
      
      const encrypted1 = encryptPassword(password, salt1);
      const encrypted2 = encryptPassword(password, salt2);
      
      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should produce decryptable ciphertext for same password and salt', () => {
      const password = 'testPassword';
      const salt = 'consistent-salt';
      
      const encrypted1 = encryptPassword(password, salt);
      const encrypted2 = encryptPassword(password, salt);
      
      // Both encrypted values should decrypt to the same password
      // Note: AES with CryptoJS uses random IV, so ciphertext may differ
      expect(decryptPassword(encrypted1, salt)).toBe(password);
      expect(decryptPassword(encrypted2, salt)).toBe(password);
    });

    it('should throw error for empty password', () => {
      expect(() => encryptPassword('', 'salt')).toThrow('Password is required');
    });

    it('should throw error for empty salt', () => {
      expect(() => encryptPassword('password', '')).toThrow('Salt is required');
    });

    it('should handle special characters in password', () => {
      const password = 'P@$$w0rd!#$%^&*(){}[]<>';
      const salt = 'user-123';
      
      const encrypted = encryptPassword(password, salt);
      expect(encrypted).toBeDefined();
      
      // Verify it can be decrypted
      const decrypted = decryptPassword(encrypted, salt);
      expect(decrypted).toBe(password);
    });

    it('should handle unicode characters in password', () => {
      const password = 'パスワード🔐密码';
      const salt = 'user-456';
      
      const encrypted = encryptPassword(password, salt);
      expect(encrypted).toBeDefined();
      
      const decrypted = decryptPassword(encrypted, salt);
      expect(decrypted).toBe(password);
    });

    it('should handle very long passwords', () => {
      const password = 'a'.repeat(1000);
      const salt = 'user-789';
      
      const encrypted = encryptPassword(password, salt);
      expect(encrypted).toBeDefined();
      
      const decrypted = decryptPassword(encrypted, salt);
      expect(decrypted).toBe(password);
    });
  });

  // =========================================================================
  // decryptPassword
  // =========================================================================
  describe('decryptPassword', () => {
    it('should decrypt an encrypted password correctly', () => {
      const originalPassword = 'mySecretPassword123';
      const salt = 'user-id-12345';
      
      const encrypted = encryptPassword(originalPassword, salt);
      const decrypted = decryptPassword(encrypted, salt);
      
      expect(decrypted).toBe(originalPassword);
    });

    it('should throw error for wrong salt', () => {
      const password = 'testPassword';
      const correctSalt = 'correct-salt';
      const wrongSalt = 'wrong-salt';
      
      const encrypted = encryptPassword(password, correctSalt);
      
      expect(() => decryptPassword(encrypted, wrongSalt)).toThrow();
    });

    it('should throw error for empty encrypted password', () => {
      expect(() => decryptPassword('', 'salt')).toThrow('Encrypted password is required');
    });

    it('should throw error for empty salt', () => {
      const encrypted = encryptPassword('password', 'salt');
      expect(() => decryptPassword(encrypted, '')).toThrow('Salt is required');
    });

    it('should throw error for invalid encrypted data', () => {
      expect(() => decryptPassword('invalid-encrypted-data', 'salt')).toThrow();
    });

    it('should handle decryption of multiple passwords', () => {
      const passwords = ['pass1', 'pass2', 'pass3'];
      const salt = 'shared-salt';
      
      passwords.forEach(password => {
        const encrypted = encryptPassword(password, salt);
        const decrypted = decryptPassword(encrypted, salt);
        expect(decrypted).toBe(password);
      });
    });
  });

  // =========================================================================
  // hashString
  // =========================================================================
  describe('hashString', () => {
    it('should create a SHA-256 hash', () => {
      const value = 'test string';
      const hash = hashString(value);
      
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash).toHaveLength(64); // SHA-256 produces 64 hex characters
    });

    it('should produce consistent hash for same input', () => {
      const value = 'consistent value';
      
      const hash1 = hashString(value);
      const hash2 = hashString(value);
      
      expect(hash1).toBe(hash2);
    });

    it('should produce different hash for different inputs', () => {
      const hash1 = hashString('value1');
      const hash2 = hashString('value2');
      
      expect(hash1).not.toBe(hash2);
    });

    it('should throw error for empty value', () => {
      expect(() => hashString('')).toThrow('Value is required');
    });

    it('should be case sensitive', () => {
      const hash1 = hashString('Password');
      const hash2 = hashString('password');
      
      expect(hash1).not.toBe(hash2);
    });
  });

  // =========================================================================
  // generateRandomKey
  // =========================================================================
  describe('generateRandomKey', () => {
    it('should generate a random key with default length', () => {
      const key = generateRandomKey();
      
      expect(key).toBeDefined();
      expect(typeof key).toBe('string');
      expect(key).toHaveLength(64); // 32 bytes = 64 hex characters
    });

    it('should generate key with specified length', () => {
      const key16 = generateRandomKey(16);
      const key64 = generateRandomKey(64);
      
      expect(key16).toHaveLength(32); // 16 bytes = 32 hex characters
      expect(key64).toHaveLength(128); // 64 bytes = 128 hex characters
    });

    it('should generate unique keys each time', () => {
      const keys = new Set<string>();
      
      for (let i = 0; i < 100; i++) {
        keys.add(generateRandomKey());
      }
      
      expect(keys.size).toBe(100);
    });

    it('should only contain hex characters', () => {
      const key = generateRandomKey();
      const hexRegex = /^[0-9a-f]+$/i;
      
      expect(hexRegex.test(key)).toBe(true);
    });
  });

  // =========================================================================
  // isEncrypted
  // =========================================================================
  describe('isEncrypted', () => {
    it('should return true for encrypted values', () => {
      const encrypted = encryptPassword('password', 'salt');
      
      expect(isEncrypted(encrypted)).toBe(true);
    });

    it('should detect encrypted vs plain text patterns', () => {
      // Encrypted values start with U2FsdGVk (base64 for "Salted__")
      const encrypted = encryptPassword('test', 'salt');
      expect(isEncrypted(encrypted)).toBe(true);
      
      // Very short strings that can't be encrypted
      expect(isEncrypted('')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isEncrypted('')).toBe(false);
    });

    it('should return false for null-like values', () => {
      // @ts-expect-error Testing invalid input
      expect(isEncrypted(null)).toBe(false);
      // @ts-expect-error Testing invalid input
      expect(isEncrypted(undefined)).toBe(false);
    });

    it('should return true for base64 encoded strings', () => {
      const base64 = 'U2FsdGVkX1+SomeBase64String==';
      expect(isEncrypted(base64)).toBe(true);
    });
  });

  // =========================================================================
  // Integration Tests
  // =========================================================================
  describe('Integration', () => {
    it('should handle full encryption/decryption cycle', () => {
      const passwords = [
        'simple',
        'Complex123!@#',
        'unicode密码',
        'with spaces and\ttabs',
        'a'.repeat(500),
      ];
      
      passwords.forEach(password => {
        const salt = generateRandomKey(16);
        const encrypted = encryptPassword(password, salt);
        
        expect(isEncrypted(encrypted)).toBe(true);
        
        const decrypted = decryptPassword(encrypted, salt);
        expect(decrypted).toBe(password);
      });
    });

    it('should maintain data integrity under concurrent operations', async () => {
      const operations = Array.from({ length: 50 }, (_, i) => ({
        password: `password-${i}`,
        salt: `salt-${i}`,
      }));
      
      const results = await Promise.all(
        operations.map(async ({ password, salt }) => {
          const encrypted = encryptPassword(password, salt);
          const decrypted = decryptPassword(encrypted, salt);
          return { original: password, decrypted };
        })
      );
      
      results.forEach(({ original, decrypted }) => {
        expect(decrypted).toBe(original);
      });
    });
  });
});

