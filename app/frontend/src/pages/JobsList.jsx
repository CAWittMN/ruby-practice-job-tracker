import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import ConfirmButton from '../components/ConfirmButton'
import { sourceLabel, statusLabel } from '../constants'

export default function JobsList() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    load()
  }, [])

  function load() {
    setLoading(true)
    api
      .get('/api/job_applications')
      .then((data) => setApplications(data || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  async function handleDelete(id) {
    await api.delete(`/api/job_applications/${id}`)
    setApplications((prev) => prev.filter((a) => a.id !== id))
  }

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>Applications</h1>
          <p className="muted">All the jobs you are tracking.</p>
        </div>
        <Link to="/jobs/new" className="btn btn-primary">
          + Add job
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <p>Loading…</p>
      ) : applications.length === 0 ? (
        <div className="empty-state">
          <p>You haven&apos;t tracked any applications yet.</p>
          <Link to="/jobs/new" className="btn btn-primary">
            Add your first job
          </Link>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="jobs-table">
            <thead>
              <tr>
                <th>Job title</th>
                <th>Company</th>
                <th>Status</th>
                <th>Applied</th>
                <th>Source</th>
                <th>To-dos</th>
                <th>Contacts</th>
                <th aria-label="actions" />
              </tr>
            </thead>
            <tbody>
              {applications.map((a) => (
                <tr key={a.id}>
                  <td>
                    <Link to={`/jobs/${a.id}`}>{a.job_title}</Link>
                  </td>
                  <td>
                    {a.company_website ? (
                      <a href={a.company_website} target="_blank" rel="noreferrer">
                        {a.company_name}
                      </a>
                    ) : (
                      a.company_name
                    )}
                  </td>
                  <td>
                    <span className={`badge badge-status status-${a.status}`}>
                      {statusLabel(a.status)}
                    </span>
                  </td>
                  <td>{a.applied_on || <span className="muted">—</span>}</td>
                  <td>{sourceLabel(a.source)}</td>
                  <td>
                    {(() => {
                      const open = a.todos.filter((t) => !t.completed).length
                      return open > 0 ? (
                        <Link to={`/jobs/${a.id}`}>{open} open</Link>
                      ) : (
                        <span className="muted">—</span>
                      )
                    })()}
                  </td>
                  <td>
                    {a.contacts.length === 0 ? (
                      <span className="muted">—</span>
                    ) : (
                      <ul className="contact-list">
                        {a.contacts.map((c) => (
                          <li key={c.id}>
                            {c.linkedin_url ? (
                              <a href={c.linkedin_url} target="_blank" rel="noreferrer">
                                {c.name}
                              </a>
                            ) : (
                              c.name
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td>
                    <ConfirmButton
                      className="btn btn-ghost btn-sm"
                      label="Delete"
                      message="Delete this application?"
                      onConfirm={() => handleDelete(a.id)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
