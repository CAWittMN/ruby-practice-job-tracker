// Lightweight theme handling: persists the user's choice and applies it by
// setting data-theme on <html>, which flips the CSS custom properties.
const STORAGE_KEY = 'theme'

export function getThemePreference() {
  return localStorage.getItem(STORAGE_KEY) || 'system'
}

function resolve(pref) {
  if (pref === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return pref
}

export function applyTheme(pref = getThemePreference()) {
  document.documentElement.dataset.theme = resolve(pref)
}

export function setThemePreference(pref) {
  localStorage.setItem(STORAGE_KEY, pref)
  applyTheme(pref)
}

// Apply the saved theme immediately and keep "system" in sync with the OS.
export function initTheme() {
  applyTheme()
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', () => {
      if (getThemePreference() === 'system') applyTheme('system')
    })
}
