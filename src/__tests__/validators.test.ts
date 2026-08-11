import { describe, it, expect } from 'vitest';
import {
  isValidEmail,
  isValidPhone,
  isNotEmpty,
  isPositiveNumber,
} from '../utils/validators';

describe('isValidEmail', () => {
  it('accepts valid email', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('name.last+tag@domain.co')).toBe(true);
  });

  it('rejects missing @', () => {
    expect(isValidEmail('invalidemail.com')).toBe(false);
  });

  it('rejects missing domain', () => {
    expect(isValidEmail('user@')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isValidEmail('')).toBe(false);
  });

  it('rejects spaces', () => {
    expect(isValidEmail('user @example.com')).toBe(false);
  });
});

describe('isValidPhone', () => {
  // ── Sin código de país (mínimo genérico: 7 dígitos) ──────────────────────
  it('accepts 10-digit number without ISO', () => {
    expect(isValidPhone('5551234567')).toBe(true);
  });

  it('accepts formatted number with dashes and parens (strips non-digits)', () => {
    expect(isValidPhone('(555) 123-4567')).toBe(true);
  });

  it('rejects numbers below the default minimum (7 digits)', () => {
    expect(isValidPhone('123456')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isValidPhone('')).toBe(false);
  });

  // ── México (MX): exactamente 10 dígitos ──────────────────────────────────
  it('accepts valid Mexican number (10 digits)', () => {
    expect(isValidPhone('5512345678', 'MX')).toBe(true);
  });

  it('rejects Mexican number with fewer than 10 digits', () => {
    expect(isValidPhone('551234567', 'MX')).toBe(false);
  });

  // ── España (ES): mínimo 9 dígitos ────────────────────────────────────────
  it('accepts valid Spanish number (9 digits)', () => {
    expect(isValidPhone('612345678', 'ES')).toBe(true);
  });

  it('rejects Spanish number with fewer than 9 digits', () => {
    expect(isValidPhone('61234567', 'ES')).toBe(false);
  });

  // ── Costa Rica (CR): mínimo 8 dígitos ────────────────────────────────────
  it('accepts valid Costa Rican number (8 digits)', () => {
    expect(isValidPhone('83456789', 'CR')).toBe(true);
  });

  it('rejects Costa Rican number with fewer than 8 digits', () => {
    expect(isValidPhone('8345678', 'CR')).toBe(false);
  });

  // ── Detección de números ficticios ────────────────────────────────────────
  it('rejects all-same-digit number', () => {
    expect(isValidPhone('5555555555', 'MX')).toBe(false);
    expect(isValidPhone('0000000000', 'MX')).toBe(false);
  });

  it('rejects strictly ascending sequential number', () => {
    expect(isValidPhone('0123456789', 'MX')).toBe(false);
  });

  it('rejects strictly descending sequential number', () => {
    expect(isValidPhone('9876543210', 'MX')).toBe(false);
  });

  it('accepts number that looks sequential but wraps (not strictly ascending)', () => {
    // 1234567890: the last pair 9→0 breaks the ascending pattern
    expect(isValidPhone('1234567890', 'MX')).toBe(true);
  });
});

describe('isNotEmpty', () => {
  it('returns true for non-empty string', () => {
    expect(isNotEmpty('hello')).toBe(true);
  });

  it('returns false for empty string', () => {
    expect(isNotEmpty('')).toBe(false);
  });

  it('returns false for whitespace-only string', () => {
    expect(isNotEmpty('   ')).toBe(false);
  });
});

describe('isPositiveNumber', () => {
  it('returns true for positive numbers', () => {
    expect(isPositiveNumber(1)).toBe(true);
    expect(isPositiveNumber(0.01)).toBe(true);
  });

  it('returns false for zero', () => {
    expect(isPositiveNumber(0)).toBe(false);
  });

  it('returns false for negative numbers', () => {
    expect(isPositiveNumber(-5)).toBe(false);
  });
});
