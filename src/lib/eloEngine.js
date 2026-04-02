const K_FACTOR = 32
export function expectedScore(ratingA, ratingB) {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400))
}
export function newRating(rating, expected, actual) {
  return Math.round(rating + K_FACTOR * (actual - expected))
}
export function calculateTeamRating(p1Rating, p2Rating) {
  return Math.round((p1Rating + p2Rating) / 2)
}
export function competitivenessScore(teamARating, teamBRating) {
  const diff = Math.abs(teamARating - teamBRating)
  if (diff < 30) return 95
  if (diff < 60) return 85
  if (diff < 100) return 72
  if (diff < 150) return 58
  return 40
}
export function getTier(rating) {
  if (rating >= 1100) return { label: 'Elite', color: '#c9a84c' }
  if (rating >= 1000) return { label: 'Pro', color: '#4ab9d4' }
  return { label: 'Club', color: '#888' }
}
