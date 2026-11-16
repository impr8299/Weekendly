// Client-side validation for the waitlist form. Gives instant feedback only;
// the backend re-validates everything and is the source of truth.
import {
  CITIES,
  FIELD_ORDER,
  INTERESTS,
  LIMITS,
  OTHER_CITY,
} from "../constants/waitlist.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const HAS_LETTER_RE = /\p{L}/u;
const CITY_NAME_RE = /^\p{L}[\p{L}\s.'-]*$/u;
const INDIAN_MOBILE_RE = /^[6-9]\d{9}$/;

// Strips spaces/dashes/brackets and a leading +91, 91 or 0. Returns what should be 10 digits.
export function normalizeMobile(raw) {
  let digits = String(raw).replace(/[\s\-().]/g, "");
  if (digits.startsWith("+91")) digits = digits.slice(3);
  else if (digits.length === 12 && digits.startsWith("91"))
    digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith("0"))
    digits = digits.slice(1);
  return digits;
}

const validators = {
  fullName({ fullName }) {
    const v = fullName.trim();
    const { min, max } = LIMITS.fullName;
    if (!v) return "Please enter your full name.";
    if (v.length < min) return `Name must be at least ${min} characters.`;
    if (v.length > max) return `Name must be ${max} characters or fewer.`;
    if (!HAS_LETTER_RE.test(v)) return "Name must contain letters.";
    return "";
  },

  email({ email }) {
    const v = email.trim();
    if (!v) return "Please enter your email address.";
    if (v.length > LIMITS.email.max)
      return `Email must be ${LIMITS.email.max} characters or fewer.`;
    if (!EMAIL_RE.test(v)) return "Enter a valid email address.";
    return "";
  },

  mobile({ mobile }) {
    const v = mobile.trim();
    if (!v) return "Please enter your mobile number.";
    const digits = normalizeMobile(v);
    if (!/^\d+$/.test(digits)) return "Mobile number can only contain digits.";
    if (digits.length !== 10) return "Enter a 10-digit mobile number.";
    if (!INDIAN_MOBILE_RE.test(digits))
      return "Indian mobile numbers start with 6, 7, 8 or 9.";
    return "";
  },

  city({ city }) {
    return CITIES.includes(city) ? "" : "Please select your city.";
  },

  cityOther({ city, cityOther }) {
    if (city !== OTHER_CITY) return "";
    const v = cityOther.trim();
    const { min, max } = LIMITS.cityOther;
    if (!v) return "Please tell us which city you live in.";
    if (v.length < min) return `City name must be at least ${min} characters.`;
    if (v.length > max) return `City name must be ${max} characters or fewer.`;
    if (!CITY_NAME_RE.test(v))
      return "City name can only contain letters, spaces, dots, apostrophes and hyphens.";
    return "";
  },

  interests({ interests }) {
    if (!interests.length) return "Pick at least one interest.";
    if (interests.some((i) => !INTERESTS.includes(i)))
      return "Please choose from the listed interests.";
    return "";
  },

  termsAccepted({ termsAccepted }) {
    return termsAccepted
      ? ""
      : "You need to agree to the terms to join the waitlist.";
  },
};

export function validateField(name, values) {
  return validators[name] ? validators[name](values) : "";
}

// Returns { fieldName: message } for every invalid field (empty object = valid).
export function validateForm(values) {
  const errors = {};
  for (const name of FIELD_ORDER) {
    const message = validateField(name, values);
    if (message) errors[name] = message;
  }
  return errors;
}

// Shapes form state into the API request body (see TECHNICAL_APPROACH.md section 5).
export function buildPayload(values) {
  return {
    fullName: values.fullName.trim().replace(/\s+/g, " "),
    email: values.email.trim(),
    mobile: values.mobile.trim(),
    city: values.city,
    cityOther: values.city === OTHER_CITY ? values.cityOther.trim() : undefined,
    interests: values.interests,
    whatsappOptIn: values.whatsappOptIn,
    termsAccepted: values.termsAccepted,
  };
}
