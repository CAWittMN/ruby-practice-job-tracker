import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { SOURCES, STATUSES, detectSource, today } from '../constants'

const CUSTOM = '__custom__'

function emptyContact() {
  return { name: '', role: '', linkedin_url: '' }
}

function emptyTodo() {
  return { title: '', due_on: '' }
}

export default function NewJob() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('interested')
  const [form, setForm] = useState({
    job_title: '',
    company_name: '',
    applied_on: today(),
    cover_letter_provided: false,
    linkedin_messages_provided: false,
    company_website: '',
    job_posting_url: '',
  })
  const [sourceSelect, setSourceSelect] = useState(SOURCES[0].value)
  const [customSource, setCustomSource] = useState('')
  const [sourceTouched, setSourceTouched] = useState(false)
  const [contacts, setContacts] = useState([emptyContact()])
  const [todos, setTodos] = useState([emptyTodo()])
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const applied = status === 'applied'

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  // Guess the source from the posting URL unless the user picked one manually.
  function handlePostingUrlChange(value) {
    update('job_posting_url', value)
    if (sourceTouched) return
    const detected = detectSource(value)
    if (!detected) return
    if (SOURCES.some((s) => s.value === detected.value)) {
      setSourceSelect(detected.value)
    } else {
      setSourceSelect(CUSTOM)
      setCustomSource(detected.label)
    }
  }

  function updateContact(index, field, value) {
    setContacts((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)),
    )
  }

  function addContact() {
    setContacts((prev) => [...prev, emptyContact()])
  }

  function removeContact(index) {
    setContacts((prev) => prev.filter((_, i) => i !== index))
  }

  function updateTodo(index, field, value) {
    setTodos((prev) =>
      prev.map((t, i) => (i === index ? { ...t, [field]: value } : t)),
    )
  }

  function addTodo() {
    setTodos((prev) => [...prev, emptyTodo()])
  }

  function removeTodo(index) {
    setTodos((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    let source = ''
    if (applied) {
      source = sourceSelect === CUSTOM ? customSource.trim() : sourceSelect
    }

    const contacts_attributes = contacts
      .filter((c) => c.name.trim() || c.linkedin_url.trim())
      .map((c) => ({
        name: c.name.trim(),
        role: c.role.trim(),
        linkedin_url: c.linkedin_url.trim(),
      }))

    const todos_attributes = todos
      .filter((t) => t.title.trim())
      .map((t) => ({ title: t.title.trim(), due_on: t.due_on || null }))

    const payload = {
      job_title: form.job_title,
      company_name: form.company_name,
      status,
      cover_letter_provided: form.cover_letter_provided,
      linkedin_messages_provided: form.linkedin_messages_provided,
      company_website: form.company_website,
      job_posting_url: form.job_posting_url,
      applied_on: applied ? form.applied_on : null,
      source,
      contacts_attributes,
      todos_attributes,
    }

    setSubmitting(true)
    try {
      await api.post('/api/job_applications', { job_application: payload })
      navigate('/jobs')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>Add a job</h1>
          <p className="muted">
            Track a job you&apos;ve applied to, or a company you&apos;re interested in
            but haven&apos;t applied to yet.
          </p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form className="form-card" onSubmit={handleSubmit}>
        <div className="status-toggle">
          {STATUSES.map((s) => (
            <label
              key={s.value}
              className={`status-option ${status === s.value ? 'is-active' : ''}`}
            >
              <input
                type="radio"
                name="status"
                value={s.value}
                checked={status === s.value}
                onChange={(e) => setStatus(e.target.value)}
              />
              {s.value === 'interested' ? 'Interested (not applied yet)' : 'Applied'}
            </label>
          ))}
        </div>

        <div className="form-grid">
          <label>
            Job title *
            <input
              type="text"
              value={form.job_title}
              onChange={(e) => update('job_title', e.target.value)}
              required
            />
          </label>
          <label>
            Company name *
            <input
              type="text"
              value={form.company_name}
              onChange={(e) => update('company_name', e.target.value)}
              required
            />
          </label>

          {applied && (
            <>
              <label>
                Date applied *
                <input
                  type="date"
                  value={form.applied_on}
                  onChange={(e) => update('applied_on', e.target.value)}
                  required
                />
              </label>
              <label>
                Source
                <select
                  value={sourceSelect}
                  onChange={(e) => {
                    setSourceTouched(true)
                    setSourceSelect(e.target.value)
                  }}
                >
                  {SOURCES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                  <option value={CUSTOM}>Other…</option>
                </select>
              </label>
              {sourceSelect === CUSTOM && (
                <label className="span-2">
                  Custom source
                  <input
                    type="text"
                    value={customSource}
                    onChange={(e) => setCustomSource(e.target.value)}
                    placeholder="e.g. Company careers page"
                  />
                </label>
              )}
            </>
          )}

          <label>
            Company website
            <input
              type="url"
              value={form.company_website}
              onChange={(e) => update('company_website', e.target.value)}
              placeholder="https://"
            />
          </label>
          <label>
            Job posting URL
            <input
              type="url"
              value={form.job_posting_url}
              onChange={(e) => handlePostingUrlChange(e.target.value)}
              placeholder="https:// (leave blank if there's no posting)"
            />
            {applied && detectSource(form.job_posting_url) && (
              <span className="field-hint detected-source">
                Detected source: {detectSource(form.job_posting_url).label}
              </span>
            )}
          </label>
        </div>

        {applied && (
          <div className="checkbox-row">
            <label className="checkbox">
              <input
                type="checkbox"
                checked={form.cover_letter_provided}
                onChange={(e) => update('cover_letter_provided', e.target.checked)}
              />
              Cover letter provided
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={form.linkedin_messages_provided}
                onChange={(e) =>
                  update('linkedin_messages_provided', e.target.checked)
                }
              />
              LinkedIn messages sent
            </label>
          </div>
        )}

        <fieldset className="contacts-fieldset">
          <legend>Contacts</legend>
          {contacts.map((contact, index) => (
            <div className="contact-row" key={index}>
              <input
                type="text"
                placeholder="Contact name"
                value={contact.name}
                onChange={(e) => updateContact(index, 'name', e.target.value)}
              />
              <input
                type="text"
                placeholder="Role (e.g. Recruiter)"
                value={contact.role}
                onChange={(e) => updateContact(index, 'role', e.target.value)}
              />
              <input
                type="url"
                placeholder="LinkedIn profile URL"
                value={contact.linkedin_url}
                onChange={(e) => updateContact(index, 'linkedin_url', e.target.value)}
              />
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => removeContact(index)}
                disabled={contacts.length === 1}
              >
                Remove
              </button>
            </div>
          ))}
          <button type="button" className="btn btn-secondary btn-sm" onClick={addContact}>
            + Add contact
          </button>
        </fieldset>

        <fieldset className="contacts-fieldset">
          <legend>To-dos</legend>
          <p className="muted field-hint">
            Next steps for this job — e.g. &ldquo;Email them about openings&rdquo;.
          </p>
          {todos.map((todo, index) => (
            <div className="todo-row" key={index}>
              <input
                type="text"
                placeholder="What needs doing?"
                value={todo.title}
                onChange={(e) => updateTodo(index, 'title', e.target.value)}
              />
              <input
                type="date"
                value={todo.due_on}
                onChange={(e) => updateTodo(index, 'due_on', e.target.value)}
              />
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => removeTodo(index)}
                disabled={todos.length === 1}
              >
                Remove
              </button>
            </div>
          ))}
          <button type="button" className="btn btn-secondary btn-sm" onClick={addTodo}>
            + Add to-do
          </button>
        </fieldset>

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => navigate('/jobs')}
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </section>
  )
}
