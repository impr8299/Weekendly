// Shown instead of the form after a successful join or a duplicate signup.
const formatNumber = (n) => Number(n).toLocaleString('en-IN')

function matchedText(matchedOn = []) {
  const hasEmail = matchedOn.includes('email')
  const hasMobile = matchedOn.includes('mobile')
  if (hasEmail && hasMobile) return 'This email and mobile number are'
  if (hasMobile) return 'This mobile number is'
  return 'This email is'
}

export default function ResultCard({ result, onReset }) {
  const isDuplicate = result.type === 'duplicate'

  return (
    <section className={`result ${isDuplicate ? 'result--duplicate' : ''}`} aria-live="polite">
      <p className="result__eyebrow">{isDuplicate ? "You're already on the list" : "You're in!"}</p>
      <p className="result__position">
        <span className="result__hash">#</span>
        {formatNumber(result.position)}
      </p>
      <p className="result__text">
        {isDuplicate
          ? `${matchedText(result.matchedOn)} already registered. That's your spot on the waitlist.`
          : "That's your spot on the Weekendly waitlist. We'll let you know as soon as we launch in your city."}
      </p>
      {typeof result.count === 'number' && (
        <p className="result__count">{formatNumber(result.count)} people have joined so far.</p>
      )}
      <button type="button" className="btn btn--ghost" onClick={onReset}>
        {isDuplicate ? 'Back to the form' : 'Sign up someone else'}
      </button>
    </section>
  )
}
