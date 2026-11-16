import { useEffect, useState } from 'react'
import { apiRequest } from '../api.js'
import { CITIES, FIELD_ORDER, INITIAL_FORM, INTERESTS, LIMITS, OTHER_CITY } from '../constants/waitlist.js'
import { buildPayload, validateField, validateForm } from '../utils/validation.js'
import TextField from '../components/TextField.jsx'
import SelectField from '../components/SelectField.jsx'
import MultiSelectChips from '../components/MultiSelectChips.jsx'
import CheckboxField from '../components/CheckboxField.jsx'
import ResultCard from '../components/ResultCard.jsx'

const ALL_TOUCHED = Object.fromEntries(FIELD_ORDER.map((f) => [f, true]))

// DOM id to focus for each field (interests is a group, so focus its first checkbox).
const focusTarget = (field) => (field === 'interests' ? `interests-${INTERESTS[0]}` : field)

function focusField(field) {
  document.getElementById(focusTarget(field))?.focus()
}

function counterText(count) {
  if (count === 0) return 'Be the first to join the waitlist.'
  const formatted = count.toLocaleString('en-IN')
  return count === 1 ? '1 person has already joined.' : `${formatted} people have already joined.`
}

export default function WaitlistPage() {
  const [values, setValues] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [result, setResult] = useState(null) // { type: 'joined' | 'duplicate', position, count, matchedOn }
  const [count, setCount] = useState(null)

  // Live "N people have joined" counter. If it fails, the counter is simply hidden.
  useEffect(() => {
    let cancelled = false
    apiRequest('/waitlist/count')
      .then(({ ok, data }) => {
        if (!cancelled && ok && typeof data?.count === 'number') setCount(data.count)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  // Re-validate a field as the user edits it, but only once it has been touched
  // (so we don't shout "required" at someone who hasn't finished typing).
  function setField(name, value, { validateNow = false } = {}) {
    const next = { ...values, [name]: value }
    setValues(next)
    setErrors((prev) => {
      const updated = { ...prev }
      if (validateNow || touched[name] || prev[name]) updated[name] = validateField(name, next)
      // City and "other city" depend on each other.
      if (name === 'city') updated.cityOther = touched.cityOther ? validateField('cityOther', next) : ''
      return updated
    })
    if (validateNow) setTouched((prev) => ({ ...prev, [name]: true }))
    if (formError) setFormError('')
  }

  function handleBlur(name) {
    setTouched((prev) => ({ ...prev, [name]: true }))
    setErrors((prev) => ({ ...prev, [name]: validateField(name, values) }))
  }

  const onText = (e) => setField(e.target.name, e.target.value)
  const onBlur = (e) => handleBlur(e.target.name)

  function toggleInterest(interest) {
    const next = values.interests.includes(interest)
      ? values.interests.filter((i) => i !== interest)
      : [...values.interests, interest]
    setField('interests', next, { validateNow: true })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (submitting) return

    const clientErrors = validateForm(values)
    setTouched(ALL_TOUCHED)
    setErrors(clientErrors)
    const firstInvalid = FIELD_ORDER.find((f) => clientErrors[f])
    if (firstInvalid) {
      setFormError('Please fix the highlighted fields below.')
      focusField(firstInvalid)
      return
    }

    setSubmitting(true)
    setFormError('')
    try {
      const { status, data } = await apiRequest('/waitlist', { method: 'POST', body: buildPayload(values) })

      if (status === 201) {
        setResult({ type: 'joined', position: data.position, count: data.count })
        if (typeof data.count === 'number') setCount(data.count)
      } else if (status === 409 && data?.error === 'ALREADY_JOINED') {
        setResult({ type: 'duplicate', position: data.position, count: data.count, matchedOn: data.matchedOn })
        if (typeof data.count === 'number') setCount(data.count)
      } else if (status === 400 && data?.fields) {
        // Server-side validation: show each message under its field.
        setErrors(data.fields)
        setFormError(data.message || 'Please fix the highlighted fields below.')
        const firstServerInvalid = FIELD_ORDER.find((f) => data.fields[f])
        if (firstServerInvalid) focusField(firstServerInvalid)
      } else if (status === 429) {
        setFormError('Too many attempts. Please wait a minute and try again.')
      } else {
        setFormError(data?.message || 'Something went wrong on our side. Please try again in a moment.')
      }
    } catch {
      setFormError("We couldn't reach the server. Check your internet connection and try again.")
    } finally {
      setSubmitting(false)
    }
  }

  function resetForm() {
    setValues(INITIAL_FORM)
    setErrors({})
    setTouched({})
    setFormError('')
    setResult(null)
  }

  return (
    <div className="page">
      <header className="hero">
        <p className="brand">Weekendly</p>
        <h1 className="hero__title">Your city's best weekends, in one place.</h1>
        <p className="hero__lead">
          Concerts, comedy nights, food festivals and more. Join the waitlist and be first in when we launch.
        </p>
        {count !== null && (
          <p className="hero__count" aria-live="polite">
            <span className="hero__dot" aria-hidden="true" />
            {counterText(count)}
          </p>
        )}
      </header>

      <main className="card">
        {result ? (
          <ResultCard result={result} onReset={resetForm} />
        ) : (
          <form className="form" onSubmit={handleSubmit} noValidate>
            <h2 className="form__title">Join the waitlist</h2>

            {formError && (
              <div className="alert" role="alert">
                {formError}
              </div>
            )}

            <TextField
              id="fullName"
              label="Full name"
              required
              autoComplete="name"
              maxLength={LIMITS.fullName.max}
              value={values.fullName}
              onChange={onText}
              onBlur={onBlur}
              error={errors.fullName}
            />

            <div className="form__row">
              <TextField
                id="email"
                label="Email"
                type="email"
                required
                autoComplete="email"
                inputMode="email"
                maxLength={LIMITS.email.max}
                placeholder="name@example.com"
                value={values.email}
                onChange={onText}
                onBlur={onBlur}
                error={errors.email}
              />
              <TextField
                id="mobile"
                label="Mobile number"
                type="tel"
                required
                autoComplete="tel"
                inputMode="tel"
                maxLength={LIMITS.mobile.max}
                placeholder="98765 43210"
                value={values.mobile}
                onChange={onText}
                onBlur={onBlur}
                error={errors.mobile}
              />
            </div>

            <SelectField
              id="city"
              label="City"
              required
              placeholder="Select your city"
              options={CITIES}
              value={values.city}
              onChange={(e) => setField('city', e.target.value, { validateNow: true })}
              onBlur={onBlur}
              error={errors.city}
            />

            {values.city === OTHER_CITY && (
              <TextField
                id="cityOther"
                label="Your city"
                required
                autoComplete="address-level2"
                maxLength={LIMITS.cityOther.max}
                placeholder="e.g. Surat"
                value={values.cityOther}
                onChange={onText}
                onBlur={onBlur}
                error={errors.cityOther}
              />
            )}

            <MultiSelectChips
              name="interests"
              legend="Interests"
              required
              options={INTERESTS}
              value={values.interests}
              onToggle={toggleInterest}
              error={errors.interests}
            />

            <CheckboxField
              id="whatsappOptIn"
              label="Send me updates on WhatsApp"
              checked={values.whatsappOptIn}
              onChange={(e) => setField('whatsappOptIn', e.target.checked)}
            />

            <CheckboxField
              id="termsAccepted"
              label="I agree to the Terms of Service and Privacy Policy"
              required
              checked={values.termsAccepted}
              onChange={(e) => setField('termsAccepted', e.target.checked, { validateNow: true })}
              error={errors.termsAccepted}
            />

            <button type="submit" className="btn btn--primary" disabled={submitting} aria-busy={submitting}>
              {submitting && <span className="spinner" aria-hidden="true" />}
              {submitting ? 'Joining…' : 'Join the waitlist'}
            </button>
          </form>
        )}
      </main>
    </div>
  )
}
