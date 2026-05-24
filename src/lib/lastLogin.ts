const KEY = 'skysafe_last_login'

export function recordLogin(): void {
  localStorage.setItem(KEY, new Date().toISOString())
}

export function getLastLogin(): Date | null {
  const raw = localStorage.getItem(KEY)
  return raw ? new Date(raw) : null
}

export function formatLoginDate(date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const yy = String(date.getFullYear()).slice(-2)
  const hh = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  const ss = String(date.getSeconds()).padStart(2, '0')
  return `${dd}/${mm}/${yy} ${hh}:${min}:${ss}`
}
