/**
 * Password Encryption Utility
 * Provides AES encryption for sensitive data like camera passwords
 * 
 * @module lib/crypto/encryption
 */

import CryptoJS from 'crypto-js';

// Encryption key from environment - MUST be set in production
const ENCRYPTION_KEY = process.env.EXPO_PUBLIC_ENCRYPTION_KEY || '';

// Validate encryption key on module load
if (!ENCRYPTION_KEY) {
  if (__DEV__) {
    console.warn(
      '[Encryption] EXPO_PUBLIC_ENCRYPTION_KEY is not set. ' +
      'Using temporary development key. All encrypted data will be invalid after restart. ' +
      'This MUST be set in production!'
    );
  } else {
    console.error(
      '[Encryption] CRITICAL: EXPO_PUBLIC_ENCRYPTION_KEY is not set in production! ' +
      'Camera passwords cannot be encrypted securely.'
    );
  }
}

/**
 * Validate encryption key strength
 * Ensures key meets minimum security requirements
 */
function validateEncryptionKey(key: string): boolean {
  // Check minimum length (32 chars for AES-256)
  if (key.length < 32) {
    console.error('[Encryption] Key is too short. Must be at least 32 characters for AES-256.');
    return false;
  }

  // Check for sufficient entropy (at least 3 of: uppercase, lowercase, numbers, symbols)
  const hasUpper = /[A-Z]/.test(key);
  const hasLower = /[a-z]/.test(key);
  const hasNumber = /[0-9]/.test(key);
  const hasSymbol = /[^A-Za-z0-9]/.test(key);

  const complexityScore = [hasUpper, hasLower, hasNumber, hasSymbol].filter(Boolean).length;
  if (complexityScore < 3) {
    console.error('[Encryption] Key lacks complexity. Should include uppercase, lowercase, numbers, and symbols.');
    return false;
  }

  return true;
}

// Secure encryption key retrieval
const getEncryptionKey = (): string => {
  if (ENCRYPTION_KEY && validateEncryptionKey(ENCRYPTION_KEY)) {
    return ENCRYPTION_KEY;
  }

  // CRITICAL: NEVER use fallback in production
  if (!__DEV__) {
    throw new Error(
      'CRITICAL SECURITY ERROR: Invalid or missing encryption key. ' +
      'Key must be at least 32 characters with high complexity. ' +
      'Camera passwords cannot be encrypted. Application cannot start safely.'
    );
  }

  // Development fallback - use temporary random key
  // This prevents sharing the same key across development environments
  const devKey = 'dev-temp-key-' + Date.now() + '-' + Math.random().toString(36).substring(2);
  console.warn(
    '[Encryption] Using temporary development key:', devKey.substring(0, 20) + '...',
    'All encrypted data will be invalid after app restart.'
  );
  return devKey;
};

/**
 * Encrypt a password using AES encryption
 * 
 * @param password - The plain text password to encrypt
 * @param salt - A unique salt (typically user ID) to prevent rainbow table attacks
 * @returns The encrypted password as a base64 string
 * 
 * @example
 * ```ts
 * const encrypted = encryptPassword('myPassword123', userId);
 * // Store `encrypted` in database
 * ```
 */
export function encryptPassword(password: string, salt: string): string {
  if (!password) {
    throw new Error('Password is required for encryption');
  }
  
  if (!salt) {
    throw new Error('Salt is required for encryption');
  }

  try {
    // Combine password with salt for added security
    const saltedPassword = `${salt}:${password}`;
    
    // Encrypt using AES
    const encrypted = CryptoJS.AES.encrypt(
      saltedPassword,
      getEncryptionKey()
    ).toString();
    
    return encrypted;
  } catch (error) {
    console.error('[Encryption] Failed to encrypt password:', error);
    throw new Error('Encryption failed');
  }
}

/**
 * Decrypt a password that was encrypted with encryptPassword
 * 
 * @param encryptedPassword - The encrypted password string
 * @param salt - The same salt used during encryption
 * @returns The original plain text password
 * 
 * @example
 * ```ts
 * const password = decryptPassword(encryptedFromDb, userId);
 * // Use `password` for camera authentication
 * ```
 */
export function decryptPassword(encryptedPassword: string, salt: string): string {
  if (!encryptedPassword) {
    throw new Error('Encrypted password is required for decryption');
  }
  
  if (!salt) {
    throw new Error('Salt is required for decryption');
  }

  try {
    // Decrypt using AES
    const bytes = CryptoJS.AES.decrypt(encryptedPassword, getEncryptionKey());
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    
    if (!decrypted) {
      throw new Error('Decryption produced empty result');
    }
    
    // Remove salt prefix
    const saltPrefix = `${salt}:`;
    if (!decrypted.startsWith(saltPrefix)) {
      throw new Error('Invalid salt - decryption failed');
    }
    
    return decrypted.substring(saltPrefix.length);
  } catch (error) {
    console.error('[Encryption] Failed to decrypt password:', error);
    throw new Error('Decryption failed - invalid key or corrupted data');
  }
}

/**
 * Create a SHA-256 hash of a string
 * Useful for comparing passwords without storing them
 * 
 * @param value - The string to hash
 * @returns The SHA-256 hash as a hex string
 */
export function hashString(value: string): string {
  if (!value) {
    throw new Error('Value is required for hashing');
  }
  
  return CryptoJS.SHA256(value).toString(CryptoJS.enc.Hex);
}

/**
 * Generate a random encryption key
 * Useful for generating secure keys
 * 
 * @param length - The length of the key in bytes (default: 32)
 * @returns A random key as a hex string
 */
export function generateRandomKey(length: number = 32): string {
  const randomWords = CryptoJS.lib.WordArray.random(length);
  return randomWords.toString(CryptoJS.enc.Hex);
}

/**
 * Check if a password is encrypted (basic heuristic)
 * 
 * @param value - The value to check
 * @returns True if the value appears to be encrypted
 */
export function isEncrypted(value: string): boolean {
  if (!value) return false;
  
  // AES encrypted strings from CryptoJS are base64 encoded
  // They typically start with "U2FsdGVk" (base64 for "Salted__")
  return value.startsWith('U2FsdGVk') || /^[A-Za-z0-9+/=]+$/.test(value);
}

