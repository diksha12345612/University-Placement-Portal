// "2026-10-05T18:29:59.999Z" -> "5 Oct 2026"
export const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''

export const isPast = (date) => new Date(date).getTime() < Date.now()

// Whole days left until a deadline (0 = closes today)
export const daysLeft = (deadline) => {
  const ms = new Date(deadline).getTime() - Date.now()
  return Math.max(0, Math.floor(ms / (24 * 60 * 60 * 1000)))
}

// Today's date as "YYYY-MM-DD" in the user's own time zone (for <input type="date" min=...>)
export const todayInputValue = () => {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}
