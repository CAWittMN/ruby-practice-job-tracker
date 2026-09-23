# Ruby Job Tracker

A Rails + React (Vite) app for tracking job applications, companies you're
interested in, contacts, communications, and to-dos — with optional email
ingestion that can auto-log recruiter replies and create applications from
confirmation emails.

## Requirements

- Ruby (see `.ruby-version`)
- Node.js (for the Vite frontend)
- SQLite (default database)

## Setup

```bash
bin/setup     # installs gems, prepares the database
bin/dev       # runs Rails + Vite together (via foreman/Procfile.dev)
```

`bin/dev` uses `foreman`, which assigns the `web` process `PORT=5100`, so the
app is served at http://localhost:5100 with the Vite dev server on port 3036.

Run the pieces manually if you prefer:

```bash
bin/rails s        # Rails API + SPA host
bin/vite dev       # Vite dev server
```

## Tests

```bash
bin/rails test
```

## Email ingestion (optional)

The app can pull messages from a mailbox over IMAP, parse them, and:

- **Auto-log replies** from known contacts/companies as `Communication`
  entries on the matching job.
- **Auto-create applications** from "you applied" confirmation emails.
- **Queue anything it can't match** in the in-app **Inbox** for one-click
  triage (log to a job, create an application, or ignore).

Because the app dials *out* over IMAP, this works for a locally deployed app
with no public inbound endpoint.

### Configure

Configure IMAP from the app's **Settings** page (no environment variables
needed). Point it at a dedicated mailbox you forward job emails into, enter your
IMAP host, username, and an app password, then enable ingestion. Use **Test
connection** to verify and **Check mail now** to pull immediately.

The stored IMAP password is encrypted at rest with Active Record Encryption. By
default the encryption keys are derived from the app's `secret_key_base` (backed
by the gitignored `config/master.key`). For production you can supply dedicated
keys via `AR_ENCRYPTION_PRIMARY_KEY`, `AR_ENCRYPTION_DETERMINISTIC_KEY`, and
`AR_ENCRYPTION_KEY_DERIVATION_SALT` (generate with `bin/rails db:encryption:init`).

### Run the poller

Settings has a **Check mail now** button, or run it from the command line for
all users who have enabled ingestion:

```bash
bin/rails emails:poll        # ingest unseen messages once
bin/rails emails:poll_loop   # poll continuously (INTERVAL seconds, default 120)
```

Schedule `emails:poll` with cron for periodic ingestion, e.g. every 5 minutes:

```cron
*/5 * * * * cd /path/to/app && bin/rails emails:poll
```

### How matching works

1. Sender address matches a contact's email → logged against that contact's job.
2. Sender domain matches a job's company website → logged against that job.
3. A confirmation email with no match → a new `applied` application is created.
4. Anything else → stored in the **Inbox** for manual triage.

Emails are treated as untrusted input: only ingest from a mailbox you control,
sender addresses are matched conservatively (they are spoofable), and unmatched
mail is never auto-trusted.
