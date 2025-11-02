/**
 * Authentication utilities for secure password handling
 */
import { createHash } from 'crypto';

/**
 * Hash a password with a secure one-way hash function
 * @param {string} password - The plain text password to hash
 * @returns {string} The hashed password
 */
export function hashPassword(password: string): string {
  // In production, use bcrypt or argon2 for better security
  // This is a simple SHA-256 hash for demonstration purposes
  return createHash('sha256').update(password).digest('hex');
}

/**
 * Verify if a plain text password matches a hashed password
 * @param {string} plainPassword - The plain text password to verify
 * @param {string} hashedPassword - The hashed password to compare against
 * @returns {boolean} True if the passwords match, false otherwise
 */
export function verifyPassword(plainPassword: string, hashedPassword: string): boolean {
  const hashedInput = hashPassword(plainPassword);
  return hashedInput === hashedPassword;
}