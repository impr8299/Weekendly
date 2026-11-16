import FieldError from './FieldError.jsx'
import { describedBy } from '../utils/aria.js'

export default function TextField({ id, label, error, required, className = '', ...inputProps }) {
  const errorId = error ? `${id}-error` : undefined

  return (
    <div className={`field ${error ? 'field--invalid' : ''} ${className}`}>
      <label className="field__label" htmlFor={id}>
        {label}
        {required && <span className="field__req" aria-hidden="true">*</span>}
      </label>
      <input
        id={id}
        name={id}
        className="field__control"
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(errorId)}
        {...inputProps}
      />
      <FieldError id={errorId} message={error} />
    </div>
  )
}
