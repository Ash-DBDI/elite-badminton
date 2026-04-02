import BottomNav from './BottomNav'
import ThemeToggle from './ThemeToggle'

export default function Layout({ children }) {
  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-left">
          <span className="header-logo">{'\u{1F3F8}'}</span>
          <h1 className="header-title">Elite Badminton</h1>
        </div>
        <ThemeToggle />
      </header>
      <main className="app-main">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
