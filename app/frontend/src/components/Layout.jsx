import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <div className="app-shell">
      <header className="navbar">
        <Link to="/" className="brand">
          Job Tracker
        </Link>
        <nav className="nav-links">
          <NavLink to="/" end>
            Dashboard
          </NavLink>
          <NavLink to="/jobs">Applications</NavLink>
          <NavLink to="/inbox">Inbox</NavLink>
          <NavLink to="/settings">Settings</NavLink>
        </nav>
        <div className="nav-actions">
          <Link to="/jobs/new" className="btn btn-primary">
            + Add job
          </Link>
          <span className="nav-user">{user?.email}</span>
          <button type="button" className="btn btn-ghost" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  )
}
