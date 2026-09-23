import { useEffect, useRef, useState } from 'react'

// A trigger button with a small inline confirmation popover that appears above
// it, replacing window.confirm for destructive actions. onConfirm may be async;
// the confirm button shows a busy state until it resolves.
export default function ConfirmButton({
  onConfirm,
  label,
  children,
  message = 'Are you sure?',
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  busyLabel = 'Deleting…',
  className = 'btn btn-ghost btn-sm',
  destructive = true,
}) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    function onDocClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  async function handleConfirm() {
    setBusy(true)
    try {
      await onConfirm()
      setOpen(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <span className="confirm-pop-wrap" ref={wrapRef}>
      <button type="button" className={className} onClick={() => setOpen((v) => !v)}>
        {children ?? label}
      </button>
      {open && (
        <div className="confirm-pop" role="dialog" aria-label={message}>
          <p className="confirm-pop-message">{message}</p>
          <div className="confirm-pop-actions">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setOpen(false)}
              disabled={busy}
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              className={`btn btn-sm ${destructive ? 'btn-danger' : 'btn-primary'}`}
              onClick={handleConfirm}
              disabled={busy}
              autoFocus
            >
              {busy ? busyLabel : confirmLabel}
            </button>
          </div>
        </div>
      )}
    </span>
  )
}
