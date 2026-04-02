export const K = 32
export const MIN_GAMES_FOR_RANK = 20

export function expectedScore(a, b) {
  return 1 / (1 + Math.pow(10, (b - a) / 400))
}
export function updatedRating(rating, expected, actual) {
  return Math.round(rating + K * (actual - expected))
}
export function teamRating(r1, r2) {
  return Math.round((r1 + r2) / 2)
}
export function balance(rA, rB) {
  const d = Math.abs(rA - rB)
  if (d < 25) return 97
  if (d < 50) return 88
  if (d < 100) return 75
  if (d < 160) return 58
  return 40
}
export function tier(rating, games) {
  if (games < MIN_GAMES_FOR_RANK) return { label: 'Unranked', color: 'var(--muted)' }
  if (rating >= 1100) return { label: 'Elite', color: '#c9a84c' }
  if (rating >= 1000) return { label: 'Pro', color: '#4ab9d4' }
  return { label: 'Club', color: 'var(--muted)' }
}
