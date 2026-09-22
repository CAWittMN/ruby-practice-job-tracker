export const SOURCES = [
  { value: 'glassdoor', label: 'Glassdoor' },
  { value: 'indeed', label: 'Indeed' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'christiantechjobs.io', label: 'christiantechjobs.io' },
  { value: 'direct-outreach', label: 'Direct outreach (no posting)' },
]

export function sourceLabel(value) {
  if (!value) return 'No posting'
  const known = SOURCES.find((s) => s.value === value)
  return known ? known.label : value
}

export const STATUSES = [
  { value: 'interested', label: 'Interested' },
  { value: 'applied', label: 'Applied' },
]

export function statusLabel(value) {
  const known = STATUSES.find((s) => s.value === value)
  return known ? known.label : value
}

// Hostname fragments mapped to a source. Ordered most-specific first.
const SOURCE_DETECTORS = [
  { host: 'christiantechjobs.io', value: 'christiantechjobs.io', label: 'christiantechjobs.io' },
  { host: 'linkedin.com', value: 'linkedin', label: 'LinkedIn' },
  { host: 'indeed.', value: 'indeed', label: 'Indeed' },
  { host: 'glassdoor.', value: 'glassdoor', label: 'Glassdoor' },
  { host: 'ziprecruiter.', value: 'ziprecruiter', label: 'ZipRecruiter' },
  { host: 'monster.', value: 'monster', label: 'Monster' },
  { host: 'dice.com', value: 'dice', label: 'Dice' },
  { host: 'simplyhired.', value: 'simplyhired', label: 'SimplyHired' },
  { host: 'builtin.com', value: 'builtin', label: 'Built In' },
  { host: 'wellfound.com', value: 'wellfound', label: 'Wellfound' },
  { host: 'angel.co', value: 'wellfound', label: 'Wellfound' },
  { host: 'greenhouse.io', value: 'greenhouse', label: 'Greenhouse' },
  { host: 'lever.co', value: 'lever', label: 'Lever' },
  { host: 'myworkdayjobs.com', value: 'workday', label: 'Workday' },
  { host: 'ashbyhq.com', value: 'ashby', label: 'Ashby' },
]

// Inspect a job posting URL and guess which site it came from.
export function detectSource(url) {
  if (!url) return null
  let host
  try {
    host = new URL(url).hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return null
  }
  const match = SOURCE_DETECTORS.find((d) => host.includes(d.host))
  return match ? { value: match.value, label: match.label } : null
}

export function today() {
  return new Date().toISOString().slice(0, 10)
}
