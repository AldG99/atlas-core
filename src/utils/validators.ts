export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Minimum local digits (excluding country code) per ISO 3166-1 alpha-2.
// Countries absent from this map use DEFAULT_MIN_DIGITS.
const PHONE_MIN_DIGITS: Record<string, number> = {
  // NANP
  MX: 10, US: 10, CA: 10, PR: 10, DO: 10,
  // South America
  AR: 10, BR: 10, CO: 10, VE: 10, PY: 9,
  CL: 9, EC: 9, PE: 9, UY: 9,
  // Central America & Caribbean
  CR: 8, CU: 8, SV: 8, GT: 8, HN: 8, NI: 8, PA: 7,
  // Europe
  ES: 9, FR: 9, DE: 10, GB: 10, IT: 9, PT: 9,
};
const DEFAULT_MIN_DIGITS = 7;

const SAME_DIGIT_RE = /^(\d)\1+$/;

const isFictitiousPhone = (digits: string): boolean => {
  if (SAME_DIGIT_RE.test(digits)) return true;
  let asc = true, desc = true;
  for (let i = 1; i < digits.length; i++) {
    if (+digits[i] - +digits[i - 1] !== 1) asc = false;
    if (+digits[i - 1] - +digits[i] !== 1) desc = false;
  }
  return asc || desc;
};

// Accepts the local phone number and an optional ISO country code.
// Validates minimum digit count per country and rejects obviously fictitious numbers.
export const isValidPhone = (phone: string, iso?: string): boolean => {
  const digits = phone.replace(/\D/g, '');
  const min = (iso ? PHONE_MIN_DIGITS[iso] : undefined) ?? DEFAULT_MIN_DIGITS;
  if (digits.length < min) return false;
  return !isFictitiousPhone(digits);
};

export const isNotEmpty = (value: string): boolean => {
  return value.trim().length > 0;
};

export const isPositiveNumber = (value: number): boolean => {
  return value > 0;
};
