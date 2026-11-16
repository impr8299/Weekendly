// Single source of truth for the waitlist form's fixed options and limits.
// Keep these in sync with the backend (validation + schema.sql CHECK constraints).

export const OTHER_CITY = 'Other'

export const CITIES = Object.freeze([
  'Ahmedabad',
  'Mumbai',
  'Delhi',
  'Bengaluru',
  'Pune',
  OTHER_CITY,
])

export const INTERESTS = Object.freeze([
  'Music',
  'Comedy',
  'Food',
  'Sports',
  'Workshops',
  'Theatre',
])

export const LIMITS = Object.freeze({
  fullName: { min: 2, max: 100 },
  email: { max: 254 },
  mobile: { max: 16 }, // raw input incl. "+91", spaces and dashes
  cityOther: { min: 2, max: 60 },
})

// Order fields appear in on the page; used to focus the first invalid field.
export const FIELD_ORDER = Object.freeze([
  'fullName',
  'email',
  'mobile',
  'city',
  'cityOther',
  'interests',
  'termsAccepted',
])

export const INITIAL_FORM = Object.freeze({
  fullName: '',
  email: '',
  mobile: '',
  city: '',
  cityOther: '',
  interests: [],
  whatsappOptIn: false,
  termsAccepted: false,
})
