import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'
import ConfirmButton from '../components/ConfirmButton'
import { SOURCES, STATUSES, sourceLabel, statusLabel, today } from '../constants'

function emptyContact() {
  return { name: '', role: '', email: '', linkedin_url: '' }
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
          email: newContact.email.trim(),
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
            email: (editingContact.email || '').trim(),
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

  async function saveField(patch) {
    setError(null)
    const updated = await api.patch(`/api/job_applications/${id}`, {
      job_application: patch,
    })
    setJob(updated)
  }

  async function handleDelete() {
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
          <h1 className="editable-heading">
            <EditableField
              label="Job title"
              value={job.job_title}
              placeholder="Job title"
              highlightMissing={false}
              onSave={(v) => saveField({ job_title: v || job.job_title })}
            />
          </h1>
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
          <ConfirmButton
            className="btn btn-ghost"
            label="Delete"
            message="Delete this job? This can't be undone."
            onConfirm={handleDelete}
          />
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="panel">
        <div className="panel-header">
          <h2>Details</h2>
          <span className="muted field-hint">Click any field to edit. Highlighted fields are missing info.</span>
        </div>
        <dl className="detail-list">
          <div>
            <dt>Company</dt>
            <dd>
              <EditableField
                label="Company"
                value={job.company_name}
                placeholder="Company name"
                highlightMissing={false}
                onSave={(v) => saveField({ company_name: v || job.company_name })}
              />
            </dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>
              <EditableField
                label="Status"
                type="select"
                options={STATUSES}
                value={job.status}
                display={(v) => statusLabel(v)}
                highlightMissing={false}
                onSave={(v) => saveField({ status: v || 'interested' })}
              />
            </dd>
          </div>
          <div>
            <dt>Applied on</dt>
            <dd>
              <EditableField
                label="Applied date"
                type="date"
                value={job.applied_on}
                highlightMissing={job.status === 'applied'}
                emptyLabel={job.status === 'applied' ? null : 'Not applied yet'}
                onSave={(v) => saveField({ applied_on: v })}
              />
            </dd>
          </div>
          <div>
            <dt>Source</dt>
            <dd>
              <EditableField
                label="Source"
                type="select"
                options={SOURCES}
                value={job.source}
                display={(v) => sourceLabel(v)}
                onSave={(v) => saveField({ source: v })}
              />
            </dd>
          </div>
          <div>
            <dt>Company website</dt>
            <dd className="detail-value">
              <EditableField
                label="Company website"
                type="url"
                value={job.company_website}
                placeholder="https://company.com"
                display={() => 'Visit website'}
                onSave={(v) => saveField({ company_website: v })}
              />
              {job.company_website && (
                <a
                  className="detail-open"
                  href={job.company_website}
                  target="_blank"
                  rel="noreferrer"
                  title="Open in new tab"
                >
                  ↗
                </a>
              )}
            </dd>
          </div>
          <div>
            <dt>Job posting</dt>
            <dd className="detail-value">
              <EditableField
                label="Job posting URL"
                type="url"
                value={job.job_posting_url}
                placeholder="https://…/job/123"
                display={() => 'View posting'}
                onSave={(v) => saveField({ job_posting_url: v })}
              />
              {job.job_posting_url && (
                <a
                  className="detail-open"
                  href={job.job_posting_url}
                  target="_blank"
                  rel="noreferrer"
                  title="Open in new tab"
                >
                  ↗
                </a>
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
                      type="email"
                      placeholder="Email"
                      value={editingContact.email || ''}
                      onChange={(e) =>
                        setEditingContact({ ...editingContact, email: e.target.value })
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
                    {c.email && (
                      <a className="contact-email" href={`mailto:${c.email}`}>
                        {c.email}
                      </a>
                    )}
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setEditingContact(c)}
                    >
                      Edit
                    </button>
                    <ConfirmButton
                      className="btn btn-ghost btn-sm"
                      label="Remove"
                      message="Remove this contact?"
                      confirmLabel="Remove"
                      busyLabel="Removing…"
                      onConfirm={() => deleteContact(c.id)}
                    />
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
            type="email"
            placeholder="Email"
            value={newContact.email}
            onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
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

// Inline click-to-edit field. Renders the value as a button; clicking swaps it
// for an input/select. Missing values are highlighted with an "Add …" prompt so
// gaps on auto-created or hand-entered jobs are obvious and one click to fill.
function EditableField({
  label,
  value,
  type = 'text',
  options,
  placeholder,
  display,
  emptyLabel,
  highlightMissing = true,
  onSave,
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value ?? '')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setDraft(value ?? '')
  }, [value])

  const isEmpty = value === null || value === undefined || value === ''

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    try {
      await onSave(draft === '' ? null : draft)
      setEditing(false)
    } finally {
      setBusy(false)
    }
  }

  function cancel() {
    setDraft(value ?? '')
    setEditing(false)
  }

  if (editing) {
    return (
      <form className="editable-field-form" onSubmit={submit}>
        {type === 'select' ? (
          <select value={draft ?? ''} onChange={(e) => setDraft(e.target.value)} autoFocus>
            <option value="">—</option>
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={type}
            value={draft ?? ''}
            placeholder={placeholder}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
          />
        )}
        <div className="row-actions">
          <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>
            Save
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={cancel}>
            Cancel
          </button>
        </div>
      </form>
    )
  }

  return (
    <button
      type="button"
      className={`editable-field${isEmpty && highlightMissing ? ' is-missing' : ''}`}
      onClick={() => setEditing(true)}
      title={`Edit ${label.toLowerCase()}`}
    >
      {isEmpty ? (
        highlightMissing ? (
          <span className="editable-add">+ Add {label.toLowerCase()}</span>
        ) : (
          <span className="muted">{emptyLabel || `Add ${label.toLowerCase()}`}</span>
        )
      ) : display ? (
        display(value)
      ) : (
        value
      )}
    </button>
  )
}
