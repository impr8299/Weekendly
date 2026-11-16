// Server-side validation for the signup payload. This is the source of truth:
// the frontend has the same rules for instant feedback, but nothing from the client is trusted.
import { CITIES, INTERESTS, LIMITS, OTHER_CITY } from './constants.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const HAS_LETTER_RE = /\p{L}/u;
const CITY_NAME_RE = /^\p{L}[\p{L}\s.'-]*$/u;
const INDIAN_MOBILE_RE = /^[6-9]\d{9}$/;

const str = (v) => (typeof v === 'string' ? v.trim() : '');

// Strips spaces/dashes/brackets and a leading +91, 91 or 0. Returns what should be 10 digits.
export function normalizeMobile(raw) {
  let digits = String(raw).replace(/[\s\-().]/g, '');
  if (digits.startsWith('+91')) digits = digits.slice(3);
  else if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return digits;
}

/**
 * Validates and normalises a signup request body.
 * Returns { errors } (field -> message) if invalid, otherwise { data } ready to insert.
 */
export function validateSignup(body) {
  const input = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
  const errors = {};

  // Full name
  const fullName = str(input.fullName).replace(/\s+/g, ' ');
  if (!fullName) errors.fullName = 'Please enter your full name.';
  else if (fullName.length < LIMITS.fullName.min)
    errors.fullName = `Name must be at least ${LIMITS.fullName.min} characters.`;
  else if (fullName.length > LIMITS.fullName.max)
    errors.fullName = `Name must be ${LIMITS.fullName.max} characters or fewer.`;
  else if (!HAS_LETTER_RE.test(fullName)) errors.fullName = 'Name must contain letters.';

  // Email (stored lower-cased so the unique index is case-insensitive)
  const email = str(input.email).toLowerCase();
  if (!email) errors.email = 'Please enter your email address.';
  else if (email.length > LIMITS.email.max)
    errors.email = `Email must be ${LIMITS.email.max} characters or fewer.`;
  else if (!EMAIL_RE.test(email)) errors.email = 'Enter a valid email address.';

  // Mobile (stored as +91XXXXXXXXXX so different formats of the same number match)
  const rawMobile = str(input.mobile);
  const digits = normalizeMobile(rawMobile);
  if (!rawMobile) errors.mobile = 'Please enter your mobile number.';
  else if (!/^\d+$/.test(digits)) errors.mobile = 'Mobile number can only contain digits.';
  else if (digits.length !== 10) errors.mobile = 'Enter a 10-digit mobile number.';
  else if (!INDIAN_MOBILE_RE.test(digits)) errors.mobile = 'Indian mobile numbers start with 6, 7, 8 or 9.';

  // City (+ free-text city when "Other")
  const city = str(input.city);
  if (!CITIES.includes(city)) errors.city = 'Please select your city.';

  let cityOther = null;
  if (city === OTHER_CITY) {
    cityOther = str(input.cityOther).replace(/\s+/g, ' ');
    if (!cityOther) errors.cityOther = 'Please tell us which city you live in.';
    else if (cityOther.length < LIMITS.cityOther.min)
      errors.cityOther = `City name must be at least ${LIMITS.cityOther.min} characters.`;
    else if (cityOther.length > LIMITS.cityOther.max)
      errors.cityOther = `City name must be ${LIMITS.cityOther.max} characters or fewer.`;
    else if (!CITY_NAME_RE.test(cityOther))
      errors.cityOther = 'City name can only contain letters, spaces, dots, apostrophes and hyphens.';
  }

  // Interests (one or more, from the fixed list, de-duplicated)
  const interests = Array.isArray(input.interests) ? [...new Set(input.interests)] : [];
  if (!interests.length) errors.interests = 'Pick at least one interest.';
  else if (interests.some((i) => !INTERESTS.includes(i)))
    errors.interests = 'Please choose from the listed interests.';

  // Terms must be explicitly true
  if (input.termsAccepted !== true)
    errors.termsAccepted = 'You need to agree to the terms to join the waitlist.';

  if (Object.keys(errors).length) return { errors };

  return {
    data: {
      fullName,
      email,
      mobile: `+91${digits}`,
      city,
      cityOther,
      interests,
      whatsappOptIn: input.whatsappOptIn === true,
    },
  };
}
