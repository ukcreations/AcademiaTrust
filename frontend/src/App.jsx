import { useMemo, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import AuthGate from './components/AuthGate.jsx'
import ToastNotifications from './components/ToastNotifications.jsx'
import Home from './pages/Home.jsx'
import AdminPortal from './pages/AdminPortal.jsx'
import VerifierPortal from './pages/VerifierPortal.jsx'
import StudentView from './pages/StudentView.jsx'
import Activity from './pages/Activity.jsx'
import Settings from './pages/Settings.jsx'

function getSessionUser() {
    try {
        const raw = localStorage.getItem('truedegree_session')
        if (!raw) return null
        const parsed = JSON.parse(raw)
        return parsed && parsed.id ? parsed : null
    } catch {
        return null
    }
}

export default function App() {
    const [currentUser, setCurrentUser] = useState(() => getSessionUser())

    const settingsPage = useMemo(
        () => <Settings currentUser={currentUser} onUpdateUser={setCurrentUser} />,
        [currentUser],
    )

    if (!currentUser) {
        return (
            <>
                <AuthGate onAuth={setCurrentUser} />
                <ToastNotifications />
            </>
        )
    }

    return (
        <>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Layout currentUser={currentUser} onLogout={() => setCurrentUser(null)} />}>
                        <Route index element={<Home />} />
                        <Route path="admin" element={<AdminPortal />} />
                        <Route path="verify" element={<VerifierPortal />} />
                        <Route path="student" element={<StudentView />} />
                        <Route path="activity" element={<Activity />} />
                        <Route path="settings" element={settingsPage} />
                    </Route>
                </Routes>
            </BrowserRouter>
            <ToastNotifications />
        </>
    )
}
