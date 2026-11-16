// Error message shown directly below a field. Linked to the input via aria-describedby.
export default function FieldError({ id, message }) {
  if (!message) return null
  return (
    <p id={id} className="field__error">
      <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
        <circle cx="8" cy="8" r="7" fill="currentColor" />
        <rect x="7.1" y="3.8" width="1.8" height="5.4" rx="0.9" fill="#fff" />
        <circle cx="8" cy="11.6" r="1" fill="#fff" />
      </svg>
      {message}
    </p>
  )
}
