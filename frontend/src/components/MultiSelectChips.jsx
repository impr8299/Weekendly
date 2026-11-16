import FieldError from './FieldError.jsx'
import { describedBy } from '../utils/aria.js'

// Multi-select as a group of real checkboxes styled as chips (keyboard + screen-reader friendly).
export default function MultiSelectChips({ name, legend, options, value, onToggle, error, required }) {
  const errorId = error ? `${name}-error` : undefined

  return (
    <fieldset
      className={`field field--group ${error ? 'field--invalid' : ''}`}
      aria-describedby={describedBy(errorId)}
      aria-invalid={error ? true : undefined}
    >
      <legend className="field__label">
        {legend}
        {required && <span className="field__req" aria-hidden="true">*</span>}
      </legend>
      <div className="chips">
        {options.map((opt) => {
          const id = `${name}-${opt}`
          const checked = value.includes(opt)
          return (
            <label key={opt} className="chip" htmlFor={id}>
              <input
                id={id}
                type="checkbox"
                name={name}
                value={opt}
                className="chip__input"
                checked={checked}
                onChange={() => onToggle(opt)}
              />
              <span className="chip__label">
                <svg className="chip__tick" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                  <path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {opt}
              </span>
            </label>
          )
        })}
      </div>
      <FieldError id={errorId} message={error} />
    </fieldset>
  )
}
