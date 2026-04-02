import { useState, useEffect } from 'react'

export default function ArrivalBanner({ playerName }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 3000)
    return () => clearTimeout(timer)
  }, [])

  if (!visible) return null

  return (
    <div className="arrival-banner">
      <span>{'\u{1F3F8}'} {playerName} has arrived!</span>
    </div>
  )
}
