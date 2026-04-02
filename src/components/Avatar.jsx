const COLORS = [
  { bg: '#2a2010', fg: '#c9a84c' },
  { bg: '#0e2830', fg: '#4ab9d4' },
  { bg: '#280e30', fg: '#c44bd4' },
  { bg: '#0e2a18', fg: '#3dba76' },
  { bg: '#2a0e0e', fg: '#e05252' },
  { bg: '#141428', fg: '#7b8cde' },
  { bg: '#28240e', fg: '#d4c44b' },
  { bg: '#0e2826', fg: '#4bd4c4' },
]

export default function Avatar({ initials, size = 36, index = 0, style = {} }) {
  const c = COLORS[Math.abs(index) % COLORS.length]
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: c.bg, color: c.fg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.34, fontWeight: 700, flexShrink: 0,
      fontFamily: "'DM Sans', sans-serif",
      ...style
    }}>
      {initials}
    </div>
  )
}
