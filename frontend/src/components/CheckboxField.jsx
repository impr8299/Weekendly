import FieldError from './FieldError.jsx'
import { describedBy } from '../utils/aria.js'

export default function CheckboxField({ id, label, error, required, ...inputProps }) {
  const errorId = error ? `${id}-error` : undefined

  return (
    <div className={`field field--checkbox ${error ? 'field--invalid' : ''}`}>
      <label className="checkbox" htmlFor={id}>
        <input
          id={id}
          name={id}
          type="checkbox"
          className="checkbox__input"
          aria-required={required || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(errorId)}
          {...inputProps}
        />
        <span className="checkbox__label">{label}</span>
      </label>
      <FieldError id={errorId} message={error} />
    </div>
  )
}
