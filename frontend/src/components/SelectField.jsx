import FieldError from './FieldError.jsx'
import { describedBy } from '../utils/aria.js'

export default function SelectField({ id, label, options, placeholder, error, required, ...selectProps }) {
  const errorId = error ? `${id}-error` : undefined

  return (
    <div className={`field ${error ? 'field--invalid' : ''}`}>
      <label className="field__label" htmlFor={id}>
        {label}
        {required && <span className="field__req" aria-hidden="true">*</span>}
      </label>
      <select
        id={id}
        name={id}
        className="field__control field__control--select"
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(errorId)}
        {...selectProps}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <FieldError id={errorId} message={error} />
    </div>
  )
}
