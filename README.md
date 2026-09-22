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

Point the app at a dedicated mailbox (e.g. a spare inbox you forward job
emails into). Set these environment variables:

| Variable        | Default | Notes                                   |
| --------------- | ------- | --------------------------------------- |
| `IMAP_HOST`     | —       | e.g. `imap.gmail.com` (required)        |
| `IMAP_USERNAME` | —       | mailbox login (required)                |
| `IMAP_PASSWORD` | —       | app password / token (required)         |
| `IMAP_PORT`     | `993`   | IMAP SSL port                           |
| `IMAP_SSL`      | `true`  | set `false` for plaintext (not advised) |
| `IMAP_MAILBOX`  | `INBOX` | folder to poll                          |

Store secrets outside version control (a gitignored `.env`, your shell, or your
deploy environment). Never commit credentials.

### Run the poller

```bash
bin/rails emails:poll        # ingest unseen messages once
bin/rails emails:poll_loop   # poll continuously (INTERVAL seconds, default 120)
```

Schedule `emails:poll` with cron for periodic ingestion, e.g. every 5 minutes:

```cron
*/5 * * * * cd /path/to/app && IMAP_HOST=... IMAP_USERNAME=... IMAP_PASSWORD=... bin/rails emails:poll
```

### How matching works

1. Sender address matches a contact's email → logged against that contact's job.
2. Sender domain matches a job's company website → logged against that job.
3. A confirmation email with no match → a new `applied` application is created.
4. Anything else → stored in the **Inbox** for manual triage.

Emails are treated as untrusted input: only ingest from a mailbox you control,
sender addresses are matched conservatively (they are spoofable), and unmatched
mail is never auto-trusted.
