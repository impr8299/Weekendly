// Fixed options and limits for the waitlist. Keep in sync with
// frontend/src/constants/waitlist.js and the CHECK constraints in schema.sql.

export const OTHER_CITY = 'Other';

export const CITIES = Object.freeze(['Ahmedabad', 'Mumbai', 'Delhi', 'Bengaluru', 'Pune', OTHER_CITY]);

export const INTERESTS = Object.freeze(['Music', 'Comedy', 'Food', 'Sports', 'Workshops', 'Theatre']);

export const LIMITS = Object.freeze({
  fullName: { min: 2, max: 100 },
  email: { max: 254 },
  cityOther: { min: 2, max: 60 },
});
