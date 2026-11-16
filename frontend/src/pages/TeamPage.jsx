import { useCallback, useEffect, useState } from 'react'
import { apiRequest, apiUrl } from '../api.js'
import TextField from '../components/TextField.jsx'

const formatDate = (iso) =>
  new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })

const cityLabel = (e) => (e.city === 'Other' ? `${e.cityOther} (Other)` : e.city)

export default function TeamPage() {
  const [view, setView] = useState('checking') // checking | login | ready
  const [entries, setEntries] = useState([])
  const [loadError, setLoadError] = useState('')
  const [loginMessage, setLoginMessage] = useState('')

  // Loads the list; drops back to the login form if the session is missing or expired.
  const loadEntries = useCallback(async () => {
    setLoadError('')
    try {
      const { ok, status, data } = await apiRequest('/admin/entries')
      if (status === 401) {
        setView('login')
        return
      }
      if (!ok) throw new Error(data?.message)
      setEntries(data.entries)
      setView('ready')
    } catch {
      setLoadError("Couldn't load the waitlist. Please try again.")
      setView('ready')
    }
  }, [])

  useEffect(() => {
    loadEntries()
  }, [loadEntries])

  async function handleLogout() {
    try {
      await apiRequest('/admin/logout', { method: 'POST' })
    } catch {
      // cookie is short-lived anyway; still return to the login form
    }
    setEntries([])
    setLoginMessage('You have been logged out.')
    setView('login')
  }

  if (view === 'checking') {
    return (
      <div className="page">
        <p className="muted">Loading…</p>
      </div>
    )
  }

  if (view === 'login') {
    return <LoginForm message={loginMessage} onSuccess={loadEntries} />
  }

  return (
    <div className="page page--wide">
      <header className="team-header">
        <div>
          <p className="brand">Weekendly team</p>
          <h1 className="team-header__title">Waitlist</h1>
          <p className="muted">
            {entries.length.toLocaleString('en-IN')} {entries.length === 1 ? 'person has' : 'people have'} joined
          </p>
        </div>
        <div className="team-header__actions">
          <a className="btn btn--primary btn--inline" href={apiUrl('/admin/entries.csv')}>
            Download CSV
          </a>
          <button type="button" className="btn btn--ghost" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>

      {loadError && (
        <div className="alert" role="alert">
          {loadError}{' '}
          <button type="button" className="link-button" onClick={loadEntries}>
            Retry
          </button>
        </div>
      )}

      <div className="card card--flush">
        {entries.length === 0 ? (
          <p className="empty">No one has joined yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">Joined</th>
                  <th scope="col">Name</th>
                  <th scope="col">Email</th>
                  <th scope="col">Mobile</th>
                  <th scope="col">City</th>
                  <th scope="col">Interests</th>
                  <th scope="col">WhatsApp</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e, index) => (
                  <tr key={e.id}>
                    <td>{index + 1}</td>
                    <td className="nowrap">{formatDate(e.createdAt)}</td>
                    <td>{e.fullName}</td>
                    <td>{e.email}</td>
                    <td className="nowrap">{e.mobile}</td>
                    <td>{cityLabel(e)}</td>
                    <td>{e.interests.join(', ')}</td>
                    <td>{e.whatsappOptIn ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function LoginForm({ message, onSuccess }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (submitting) return
    setFormError('')

    if (!password) {
      setError('Please enter the team password.')
      document.getElementById('password')?.focus()
      return
    }

    setSubmitting(true)
    try {
      const { ok, status, data } = await apiRequest('/admin/login', { method: 'POST', body: { password } })
      if (ok) {
        await onSuccess()
        return
      }
      if (data?.fields?.password) {
        setError(data.fields.password)
        document.getElementById('password')?.focus()
      } else if (status === 429) {
        setFormError(data?.message || 'Too many login attempts. Please wait and try again.')
      } else {
        setFormError(data?.message || 'Something went wrong. Please try again.')
      }
    } catch {
      setFormError("We couldn't reach the server. Check your connection and try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page">
      <header className="hero">
        <p className="brand">Weekendly team</p>
        <h1 className="hero__title">Team login</h1>
      </header>
      <main className="card">
        <form className="form" onSubmit={handleSubmit} noValidate>
          {message && !formError && <div className="notice">{message}</div>}
          {formError && (
            <div className="alert" role="alert">
              {formError}
            </div>
          )}
          <TextField
            id="password"
            label="Team password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (error) setError('')
            }}
            error={error}
          />
          <button type="submit" className="btn btn--primary" disabled={submitting} aria-busy={submitting}>
            {submitting && <span className="spinner" aria-hidden="true" />}
            {submitting ? 'Logging in…' : 'Log in'}
          </button>
        </form>
      </main>
    </div>
  )
}
