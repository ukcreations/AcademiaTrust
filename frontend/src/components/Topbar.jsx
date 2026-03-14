import { useLocation } from 'react-router-dom'
import { Moon, Sun } from 'lucide-react'
import { useDarkMode } from '../hooks/useDarkMode'

const pageMeta = {
    '/': { title: 'Dashboard', subtitle: 'Overview of TrueDegree trust network' },
    '/admin': { title: 'Issue Degree', subtitle: 'Uploader portal to mint degree records on-chain' },
    '/verify': { title: 'Verify Degree', subtitle: 'Verifier portal to validate certificate authenticity' },
    '/student': { title: 'Student Lookup', subtitle: 'Search degree credentials by roll number' },
    '/activity': { title: 'Activity', subtitle: 'Recent app events and workflow timeline' },
    '/settings': { title: 'Settings', subtitle: 'Manage account and network preferences' },
}

export default function Topbar({ currentUser, onLogout }) {
    const { pathname } = useLocation()
    const { isDark, toggleDark } = useDarkMode()
    const meta = pageMeta[pathname] || pageMeta['/']

    const roleLabel = currentUser?.role
        ? currentUser.role[0].toUpperCase() + currentUser.role.slice(1)
        : 'User'

    function handleLogout() {
        localStorage.removeItem('truedegree_session')
        onLogout()
    }

    return (
        <header className="topbar">
            <div className="topbar-left">
                <h1>{meta.title}</h1>
                <p>{meta.subtitle}</p>
            </div>
            <div className="topbar-right">
                <button
                    onClick={toggleDark}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '8px', borderRadius: '50%' }}
                    title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
                >
                    {isDark ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--white-glass)', padding: '4px 12px', borderRadius: 'var(--radius-full)', border: '1px solid var(--glass-border)', backdropFilter: 'var(--glass-blur)' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green-500)', boxShadow: 'var(--shadow-neon-green)' }} />
                    <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--gray-700)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Connected</span>
                </div>
                <div style={{ background: 'var(--white-glass)', padding: '4px 12px', borderRadius: 'var(--radius-full)', border: '1px solid var(--glass-border)', fontSize: 11, fontWeight: 800, color: 'var(--orange-500)', letterSpacing: '0.05em', textTransform: 'uppercase', backdropFilter: 'var(--glass-blur)' }}>
                    {roleLabel}
                </div>
                <div className="top-user-name" style={{ fontWeight: 800, color: 'var(--gray-900)' }}>{currentUser?.name || 'User'}</div>
                <button type="button" className="btn btn-secondary btn-sm" onClick={handleLogout}>Logout</button>
            </div>
        </header>
    )
}
