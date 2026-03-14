import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import Topbar from './Topbar.jsx'

export default function Layout({ currentUser, onLogout }) {
    return (
        <div className="app-shell">
            <Sidebar />
            <div className="main-content">
                <Topbar currentUser={currentUser} onLogout={onLogout} />
                <Outlet />
            </div>
        </div>
    )
}
