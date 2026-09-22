import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'
import { sourceLabel, statusLabel, today } from '../constants'

function emptyContact() {
  return { name: '', role: '', linkedin_url: '' }
}

function emptyComm() {
  return { occurred_on: today(), channel: '', contact_id: '', note: '' }
}

export default function JobDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [newTodo, setNewTodo] = useState('')
  const [newTodoDue, setNewTodoDue] = useState('')
  const [saving, setSaving] = useState(false)

  const [newContact, setNewContact] = useState(emptyContact())
  const [editingContact, setEditingContact] = useState(null)

  const [newComm, setNewComm] = useState(emptyComm())

  useEffect(() => {
    api
      .get(`/api/job_applications/${id}`)
      .then((data) => setJob(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  async function addTodo(e) {
    e.preventDefault()
    const title = newTodo.trim()
    if (!title) return
    setSaving(true)
    try {
      const todo = await api.post(`/api/job_applications/${id}/todos`, {
        todo: { title, due_on: newTodoDue || null },
      })
      setJob((prev) => ({ ...prev, todos: [...prev.todos, todo] }))
      setNewTodo('')
      setNewTodoDue('')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function toggleTodo(todo) {
    const updated = await api.patch(
      `/api/job_applications/${id}/todos/${todo.id}`,
      { todo: { completed: !todo.completed } },
    )
    setJob((prev) => ({
      ...prev,
      todos: prev.todos.map((t) => (t.id === updated.id ? updated : t)),
    }))
  }

  async function deleteTodo(todoId) {
    await api.delete(`/api/job_applications/${id}/todos/${todoId}`)
    setJob((prev) => ({
      ...prev,
      todos: prev.todos.filter((t) => t.id !== todoId),
    }))
  }

  async function addContact(e) {
    e.preventDefault()
    if (!newContact.name.trim()) return
    setError(null)
    try {
      const contact = await api.post(`/api/job_applications/${id}/contacts`, {
        contact: {
          name: newContact.name.trim(),
          role: newContact.role.trim(),
          linkedin_url: newContact.linkedin_url.trim(),
        },
      })
      setJob((prev) => ({ ...prev, contacts: [...prev.contacts, contact] }))
      setNewContact(emptyContact())
    } catch (err) {
      setError(err.message)
    }
  }

  async function saveContact(e) {
    e.preventDefault()
    if (!editingContact.name.trim()) return
    setError(null)
    try {
      const updated = await api.patch(
        `/api/job_applications/${id}/contacts/${editingContact.id}`,
        {
          contact: {
            name: editingContact.name.trim(),
            role: (editingContact.role || '').trim(),
            linkedin_url: (editingContact.linkedin_url || '').trim(),
          },
        },
      )
      setJob((prev) => ({
        ...prev,
        contacts: prev.contacts.map((c) => (c.id === updated.id ? updated : c)),
      }))
      setEditingContact(null)
    } catch (err) {
      setError(err.message)
    }
  }

  async function deleteContact(contactId) {
    if (!window.confirm('Remove this contact?')) return
    await api.delete(`/api/job_applications/${id}/contacts/${contactId}`)
    setJob((prev) => ({
      ...prev,
      contacts: prev.contacts.filter((c) => c.id !== contactId),
    }))
  }

  async function addCommunication(e) {
    e.preventDefault()
    if (!newComm.note.trim()) return
    setError(null)
    try {
      const comm = await api.post(`/api/job_applications/${id}/communications`, {
        communication: {
          occurred_on: newComm.occurred_on || null,
          channel: newComm.channel.trim(),
          contact_id: newComm.contact_id || null,
          note: newComm.note.trim(),
        },
      })
      setJob((prev) => ({ ...prev, communications: [comm, ...prev.communications] }))
      setNewComm(emptyComm())
    } catch (err) {
      setError(err.message)
    }
  }

  async function deleteCommunication(commId) {
    await api.delete(`/api/job_applications/${id}/communications/${commId}`)
    setJob((prev) => ({
      ...prev,
      communications: prev.communications.filter((c) => c.id !== commId),
    }))
  }

  async function markApplied() {
    const updated = await api.patch(`/api/job_applications/${id}`, {
      job_application: { status: 'applied', applied_on: today() },
    })
    setJob(updated)
  }

  async function handleDelete() {
    if (!window.confirm('Delete this job?')) return
    await api.delete(`/api/job_applications/${id}`)
    navigate('/jobs')
  }

  if (loading) return <p>Loading…</p>
  if (error && !job) return <div className="alert alert-error">{error}</div>
  if (!job) return null

  const openTodos = job.todos.filter((t) => !t.completed)
  const doneTodos = job.todos.filter((t) => t.completed)
  const contactName = (cid) => job.contacts.find((c) => c.id === cid)?.name

  return (
    <section>
      <div className="page-header">
        <div>
          <div className="breadcrumbs">
            <Link to="/jobs">← Applications</Link>
          </div>
          <h1>{job.job_title}</h1>
          <p className="muted">
            <span className={`badge badge-status status-${job.status}`}>
              {statusLabel(job.status)}
            </span>{' '}
            {job.company_website ? (
              <a href={job.company_website} target="_blank" rel="noreferrer">
                {job.company_name}
              </a>
            ) : (
              job.company_name
            )}
          </p>
        </div>
        <div className="nav-actions">
          {job.status === 'interested' && (
            <button type="button" className="btn btn-primary" onClick={markApplied}>
              Mark as applied
            </button>
          )}
          <button type="button" className="btn btn-ghost" onClick={handleDelete}>
            Delete
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="panel">
        <div className="panel-header">
          <h2>Details</h2>
        </div>
        <dl className="detail-list">
          <div>
            <dt>Status</dt>
            <dd>{statusLabel(job.status)}</dd>
          </div>
          <div>
            <dt>Applied on</dt>
            <dd>{job.applied_on || <span className="muted">Not applied yet</span>}</dd>
          </div>
          <div>
            <dt>Source</dt>
            <dd>{sourceLabel(job.source)}</dd>
          </div>
          <div>
            <dt>Job posting</dt>
            <dd>
              {job.job_posting_url ? (
                <a href={job.job_posting_url} target="_blank" rel="noreferrer">
                  View posting
                </a>
              ) : (
                <span className="muted">No posting</span>
              )}
            </dd>
          </div>
        </dl>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2>Contacts</h2>
          <span className="muted">{job.contacts.length}</span>
        </div>

        {job.contacts.length === 0 ? (
          <p className="muted">No contacts yet. Add a recruiter or team member below.</p>
        ) : (
          <ul className="entity-list">
            {job.contacts.map((c) =>
              editingContact && editingContact.id === c.id ? (
                <li key={c.id}>
                  <form className="contact-edit" onSubmit={saveContact}>
                    <input
                      type="text"
                      placeholder="Name"
                      value={editingContact.name}
                      onChange={(e) =>
                        setEditingContact({ ...editingContact, name: e.target.value })
                      }
                    />
                    <input
                      type="text"
                      placeholder="Role"
                      value={editingContact.role || ''}
                      onChange={(e) =>
                        setEditingContact({ ...editingContact, role: e.target.value })
                      }
                    />
                    <input
                      type="url"
                      placeholder="LinkedIn URL"
                      value={editingContact.linkedin_url || ''}
                      onChange={(e) =>
                        setEditingContact({
                          ...editingContact,
                          linkedin_url: e.target.value,
                        })
                      }
                    />
                    <div className="row-actions">
                      <button type="submit" className="btn btn-primary btn-sm">
                        Save
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => setEditingContact(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </li>
              ) : (
                <li key={c.id}>
                  <div>
                    {c.linkedin_url ? (
                      <a href={c.linkedin_url} target="_blank" rel="noreferrer">
                        <strong>{c.name}</strong>
                      </a>
                    ) : (
                      <strong>{c.name}</strong>
                    )}
                    {c.role && <span className="muted"> · {c.role}</span>}
                  </div>
                  <div className="row-actions">
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setEditingContact(c)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => deleteContact(c.id)}
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ),
            )}
          </ul>
        )}

        <form className="contact-add" onSubmit={addContact}>
          <input
            type="text"
            placeholder="Name"
            value={newContact.name}
            onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
          />
          <input
            type="text"
            placeholder="Role (e.g. Recruiter)"
            value={newContact.role}
            onChange={(e) => setNewContact({ ...newContact, role: e.target.value })}
          />
          <input
            type="url"
            placeholder="LinkedIn URL"
            value={newContact.linkedin_url}
            onChange={(e) =>
              setNewContact({ ...newContact, linkedin_url: e.target.value })
            }
          />
          <button type="submit" className="btn btn-secondary btn-sm">
            Add
          </button>
        </form>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2>Communications</h2>
          <span className="muted">{job.communications.length}</span>
        </div>
        <p className="muted field-hint">
          Log messages and calls with recruiters or team members.
        </p>

        <form className="comm-add" onSubmit={addCommunication}>
          <div className="comm-add-fields">
            <input
              type="date"
              value={newComm.occurred_on}
              onChange={(e) =>
                setNewComm({ ...newComm, occurred_on: e.target.value })
              }
            />
            <input
              type="text"
              list="comm-channels"
              placeholder="Channel (e.g. LinkedIn)"
              value={newComm.channel}
              onChange={(e) => setNewComm({ ...newComm, channel: e.target.value })}
            />
            <datalist id="comm-channels">
              <option value="LinkedIn" />
              <option value="Email" />
              <option value="Phone" />
              <option value="In person" />
            </datalist>
            <select
              value={newComm.contact_id}
              onChange={(e) =>
                setNewComm({ ...newComm, contact_id: e.target.value })
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
          </div>
          <textarea
            rows={2}
            placeholder="What was said? (e.g. Messaged Jane about the role)"
            value={newComm.note}
            onChange={(e) => setNewComm({ ...newComm, note: e.target.value })}
          />
          <div className="form-actions">
            <button type="submit" className="btn btn-primary btn-sm">
              Log communication
            </button>
          </div>
        </form>

        {job.communications.length === 0 ? (
          <p className="muted">No communications logged yet.</p>
        ) : (
          <ul className="comm-list">
            {job.communications.map((comm) => (
              <li key={comm.id}>
                <div className="comm-head">
                  <span className="comm-meta">
                    {comm.occurred_on || 'Undated'}
                    {comm.channel && <span className="badge">{comm.channel}</span>}
                    {comm.contact_id && contactName(comm.contact_id) && (
                      <span className="muted">· {contactName(comm.contact_id)}</span>
                    )}
                  </span>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => deleteCommunication(comm.id)}
                  >
                    Remove
                  </button>
                </div>
                <p className="comm-note">{comm.note}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2>To-dos</h2>
          <span className="muted">{openTodos.length} open</span>
        </div>

        <form className="todo-add" onSubmit={addTodo}>
          <input
            type="text"
            placeholder="Add a to-do (e.g. Email them about openings)"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
          />
          <input
            type="date"
            value={newTodoDue}
            onChange={(e) => setNewTodoDue(e.target.value)}
          />
          <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
            Add
          </button>
        </form>

        {job.todos.length === 0 ? (
          <p className="muted">No to-dos yet. Add your first next step above.</p>
        ) : (
          <ul className="todo-list">
            {openTodos.concat(doneTodos).map((todo) => (
              <li key={todo.id} className={todo.completed ? 'is-done' : ''}>
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => toggleTodo(todo)}
                  />
                  <span className="todo-title">{todo.title}</span>
                </label>
                <div className="todo-meta">
                  {todo.due_on && <span className="muted">Due {todo.due_on}</span>}
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => deleteTodo(todo.id)}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
