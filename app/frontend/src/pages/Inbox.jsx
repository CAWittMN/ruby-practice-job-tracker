import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { sourceLabel } from '../constants'

export default function Inbox() {
  const [emails, setEmails] = useState([])
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selection, setSelection] = useState({})

  useEffect(() => {
    Promise.all([
      api.get('/api/ingested_emails'),
      api.get('/api/job_applications'),
    ])
      .then(([mail, apps]) => {
        setEmails(mail || [])
        setJobs(apps || [])
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  function setSel(emailId, patch) {
    setSelection((prev) => ({ ...prev, [emailId]: { ...prev[emailId], ...patch } }))
  }

  function removeEmail(emailId) {
    setEmails((prev) => prev.filter((e) => e.id !== emailId))
  }

  async function assign(email) {
    const sel = selection[email.id] || {}
    if (!sel.job_application_id) {
      setError('Pick a job to log this email against.')
      return
    }
    setError(null)
    try {
      await api.patch(`/api/ingested_emails/${email.id}/assign`, {
        job_application_id: sel.job_application_id,
        contact_id: sel.contact_id || null,
      })
      removeEmail(email.id)
    } catch (err) {
      setError(err.message)
    }
  }

  async function createApplication(email) {
    setError(null)
    try {
      await api.post(`/api/ingested_emails/${email.id}/create_application`)
      removeEmail(email.id)
      const apps = await api.get('/api/job_applications')
      setJobs(apps || [])
    } catch (err) {
      setError(err.message)
    }
  }

  async function ignore(email) {
    await api.patch(`/api/ingested_emails/${email.id}/ignore`)
    removeEmail(email.id)
  }

  async function remove(email) {
    if (!window.confirm('Delete this email?')) return
    await api.delete(`/api/ingested_emails/${email.id}`)
    removeEmail(email.id)
  }

  const selectedJob = (emailId) =>
    jobs.find((j) => String(j.id) === String((selection[emailId] || {}).job_application_id))

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>Inbox</h1>
          <p className="muted">
            Emails pulled in from your mailbox that need a home. Log them against a
            job or create a new application.
          </p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <p>Loading…</p>
      ) : emails.length === 0 ? (
        <div className="empty-state">
          <p>Nothing to triage. Matched emails are logged automatically.</p>
          <Link to="/jobs" className="btn btn-primary">
            View applications
          </Link>
        </div>
      ) : (
        <div className="panel">
          {emails.map((email) => {
            const job = selectedJob(email.id)
            return (
              <div className="inbox-item" key={email.id}>
                <div className="inbox-head">
                  <h2 className="inbox-subject">{email.subject || '(no subject)'}</h2>
                  <span className="badge kind-tag">{email.kind}</span>
                </div>
                <div className="inbox-meta">
                  <span>
                    From: {email.from_name ? `${email.from_name} · ` : ''}
                    {email.from_address}
                  </span>
                  {email.received_at && (
                    <span>· {new Date(email.received_at).toLocaleString()}</span>
                  )}
                  {email.detected_source && (
                    <span className="badge">{sourceLabel(email.detected_source)}</span>
                  )}
                  {email.detected_company && (
                    <span>· {email.detected_company}</span>
                  )}
                </div>
                <p className="inbox-snippet">{email.snippet}</p>

                <div className="inbox-actions">
                  <select
                    value={(selection[email.id] || {}).job_application_id || ''}
                    onChange={(e) =>
                      setSel(email.id, {
                        job_application_id: e.target.value,
                        contact_id: '',
                      })
                    }
                  >
                    <option value="">Log to job…</option>
                    {jobs.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.company_name} — {j.job_title}
                      </option>
                    ))}
                  </select>

                  {job && job.contacts.length > 0 && (
                    <select
                      value={(selection[email.id] || {}).contact_id || ''}
                      onChange={(e) =>
                        setSel(email.id, { contact_id: e.target.value })
                      }
                    >
                      <option value="">No specific contact</option>
                      {job.contacts.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                          {c.role ? ` (${c.role})` : ''}
                        </option>
                      ))}
                    </select>
                  )}

                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => assign(email)}
                  >
                    Log communication
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => createApplication(email)}
                  >
                    Create application
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => ignore(email)}
                  >
                    Ignore
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => remove(email)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
