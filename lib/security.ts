
import CryptoJS from 'crypto-js';
import DOMPurify from 'dompurify';

// In a real production environment, these secrets would be Environment Variables
// injected at build time, and we would use Web Crypto API for higher performance.
const ENCRYPTION_KEY = 'velohub-secure-storage-key-v1';
const SALT = 'velohub-auth-salt';

/**
 * Encrypts sensitive data before storing in localStorage
 */
export const encryptData = (data: any): string => {
  try {
    const jsonString = JSON.stringify(data);
    return CryptoJS.AES.encrypt(jsonString, ENCRYPTION_KEY).toString();
  } catch (error) {
    console.error('Encryption Failed', error);
    return '';
  }
};

/**
 * Decrypts data retrieved from localStorage
 */
export const decryptData = (ciphertext: string): any => {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
    const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decryptedData);
  } catch (error) {
    // If decryption fails (e.g. data wasn't encrypted or key changed), return null
    // preventing the app from crashing.
    return null;
  }
};

/**
 * Hashes passwords using SHA-256 with a salt to prevent Rainbow Table attacks.
 * Never store plain text passwords.
 */
export const hashPassword = (password: string): string => {
  return CryptoJS.SHA256(password + SALT).toString();
};

/**
 * Sanitizes user input to prevent XSS (Cross-Site Scripting) attacks.
 * Use this on any string input before saving to state/db.
 */
export const sanitizeInput = (dirty: string): string => {
  if (typeof dirty !== 'string') return dirty;
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [], // Strip all HTML tags
    ALLOWED_ATTR: []  // Strip all attributes
  });
};
