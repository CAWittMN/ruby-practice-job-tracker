import { useEffect, useState } from 'react'
import { api } from '../api'
import { getThemePreference, setThemePreference } from '../theme'

const EMPTY = {
  enabled: false,
  imap_host: '',
  imap_port: 993,
  imap_ssl: true,
  imap_username: '',
  imap_mailbox: 'INBOX',
}

export default function Settings() {
  const [form, setForm] = useState(EMPTY)
  const [password, setPassword] = useState('')
  const [hasPassword, setHasPassword] = useState(false)
  const [meta, setMeta] = useState({ ready: false, last_polled_at: null })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [theme, setTheme] = useState(getThemePreference())

  function chooseTheme(value) {
    setTheme(value)
    setThemePreference(value)
  }

  useEffect(() => {
    api
      .get('/api/email_setting')
      .then((data) => applyData(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  function applyData(data) {
    setForm({
      enabled: data.enabled,
      imap_host: data.imap_host || '',
      imap_port: data.imap_port || 993,
      imap_ssl: data.imap_ssl,
      imap_username: data.imap_username || '',
      imap_mailbox: data.imap_mailbox || 'INBOX',
    })
    setHasPassword(data.has_password)
    setMeta({ ready: data.ready, last_polled_at: data.last_polled_at })
  }

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function payload() {
    const body = { ...form }
    if (password) body.imap_password = password
    return { email_setting: body }
  }

  async function save(e) {
    e.preventDefault()
    setError(null)
    setNotice(null)
    setSaving(true)
    try {
      const data = await api.patch('/api/email_setting', payload())
      applyData(data)
      setPassword('')
      setNotice('Settings saved.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function testConnection() {
    setError(null)
    setNotice(null)
    try {
      await api.post('/api/email_setting/test')
      setNotice('Connection successful.')
    } catch (err) {
      setError(err.message)
    }
  }

  async function pollNow() {
    setError(null)
    setNotice(null)
    try {
      const res = await api.post('/api/email_setting/poll')
      setNotice(
        `Checked mail: ${res.ingested} ingested (${res.matched} matched, ${res.pending} pending review).`,
      )
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) return <p>Loading…</p>

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>Email settings</h1>
          <p className="muted">
            Connect a mailbox over IMAP to auto-log recruiter replies and import
            applications. The app polls the mailbox — nothing is exposed publicly.
          </p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {notice && <div className="alert alert-success">{notice}</div>}

      <div className="form-card">
        <h2 className="settings-heading">Appearance</h2>
        <p className="muted field-hint">Choose how the app looks.</p>
        <div className="theme-toggle">
          {[
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
            { value: 'system', label: 'System' },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`btn btn-sm ${theme === opt.value ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => chooseTheme(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <form className="form-card" onSubmit={save}>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={form.enabled}
            onChange={(e) => update('enabled', e.target.checked)}
          />
          Enable email ingestion
        </label>

        <div className="form-grid">
          <label>
            IMAP host
            <input
              type="text"
              value={form.imap_host}
              onChange={(e) => update('imap_host', e.target.value)}
              placeholder="imap.gmail.com"
            />
          </label>
          <label>
            Port
            <input
              type="number"
              value={form.imap_port}
              onChange={(e) => update('imap_port', Number(e.target.value))}
            />
          </label>
          <label>
            Username
            <input
              type="text"
              value={form.imap_username}
              onChange={(e) => update('imap_username', e.target.value)}
              placeholder="you@example.com"
              autoComplete="username"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={hasPassword ? '•••••••• (unchanged)' : 'App password or token'}
              autoComplete="new-password"
            />
          </label>
          <label>
            Mailbox
            <input
              type="text"
              value={form.imap_mailbox}
              onChange={(e) => update('imap_mailbox', e.target.value)}
              placeholder="INBOX"
            />
          </label>
          <label className="checkbox span-2">
            <input
              type="checkbox"
              checked={form.imap_ssl}
              onChange={(e) => update('imap_ssl', e.target.checked)}
            />
            Use SSL/TLS
          </label>
        </div>

        <p className="muted field-hint">
          Status: {meta.ready ? 'Ready to poll.' : 'Not ready — enable and fill in host, username and password.'}
          {meta.last_polled_at &&
            ` Last checked ${new Date(meta.last_polled_at).toLocaleString()}.`}
        </p>

        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={testConnection}>
            Test connection
          </button>
          <button type="button" className="btn btn-secondary" onClick={pollNow}>
            Check mail now
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save settings'}
          </button>
        </div>
      </form>
    </section>
  )
}
