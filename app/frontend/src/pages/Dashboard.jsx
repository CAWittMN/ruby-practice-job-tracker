import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../AuthContext'
import { sourceLabel } from '../constants'

export default function Dashboard() {
  const { user } = useAuth()
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get('/api/job_applications')
      .then((data) => setApplications(data || []))
      .finally(() => setLoading(false))
  }, [])

  const applied = applications.filter((a) => a.status === 'applied')
  const interested = applications.filter((a) => a.status === 'interested')
  const openTodos = applications.reduce(
    (sum, a) => sum + a.todos.filter((t) => !t.completed).length,
    0,
  )
  const recent = applied.slice(0, 5)

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">Welcome back, {user?.email}.</p>
        </div>
        <Link to="/jobs/new" className="btn btn-primary">
          + Add job
        </Link>
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : (
        <>
          <div className="stat-grid">
            <div className="stat-card">
              <span className="stat-value">{applied.length}</span>
              <span className="stat-label">Applications</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{interested.length}</span>
              <span className="stat-label">Tracking (not applied)</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{openTodos}</span>
              <span className="stat-label">Open to-dos</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{applications.length}</span>
              <span className="stat-label">Total jobs</span>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h2>Interested — not applied yet</h2>
              <Link to="/jobs/new">Add one</Link>
            </div>
            {interested.length === 0 ? (
              <p className="muted">
                Nothing on your radar yet. Track a company you&apos;d like to work for,
                even before there&apos;s a posting.
              </p>
            ) : (
              <ul className="tracking-list">
                {interested.map((a) => {
                  const open = a.todos.filter((t) => !t.completed)
                  return (
                    <li key={a.id}>
                      <div className="tracking-main">
                        <Link to={`/jobs/${a.id}`}>
                          <strong>{a.company_name}</strong>
                        </Link>
                        <span className="muted"> · {a.job_title}</span>
                      </div>
                      {open.length === 0 ? (
                        <span className="muted">No to-dos</span>
                      ) : (
                        <span className="badge">
                          {open.length} to-do{open.length > 1 ? 's' : ''}: {open[0].title}
                          {open.length > 1 ? '…' : ''}
                        </span>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <div className="panel">
            <div className="panel-header">
              <h2>Recent applications</h2>
              <Link to="/jobs">View all</Link>
            </div>
            {recent.length === 0 ? (
              <p className="muted">
                No applications yet. <Link to="/jobs/new">Add your first one.</Link>
              </p>
            ) : (
              <ul className="recent-list">
                {recent.map((a) => (
                  <li key={a.id}>
                    <div>
                      <Link to={`/jobs/${a.id}`}>
                        <strong>{a.job_title}</strong>
                      </Link>
                      <span className="muted"> · {a.company_name}</span>
                    </div>
                    <div className="muted">
                      {a.applied_on} · {sourceLabel(a.source)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </section>
  )
}
