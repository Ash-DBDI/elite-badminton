export default function Avatar({ initials, color = '#c9a84c', size = 40 }) {
  return (
    <div
      className="avatar"
      style={{
        width: size,
        height: size,
        backgroundColor: color + '22',
        border: `2px solid ${color}`,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.38,
        fontWeight: 700,
        color: color,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  )
}
