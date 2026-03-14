import { useMemo, useState } from 'react'
import { addActivity } from '../utils/activity.js'
import { demoUsers, getDemoUser } from '../utils/demoData.js'

const USERS_KEY = 'truedegree_users'

const roleMeta = {
    uploader: {
        label: 'Uploader',
        subtitle: 'University admin that issues degree records',
        icon: '🏛️',
    },
    verifier: {
        label: 'Verifier',
        subtitle: 'Recruiter or employer who verifies certificates',
        icon: '🛡️',
    },
    student: {
        label: 'Student',
        subtitle: 'Learner who checks their own credential card',
        icon: '🎓',
    },
}

function getUsers() {
    try {
        const raw = localStorage.getItem(USERS_KEY)
        const parsed = raw ? JSON.parse(raw) : []
        return Array.isArray(parsed) ? parsed : []
    } catch {
        return []
    }
}

function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export default function AuthGate({ onAuth }) {
    const [mode, setMode] = useState('signup')
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [role, setRole] = useState('verifier')
    const [error, setError] = useState('')
    const [demoMode, setDemoMode] = useState(false)

    const subtitle = useMemo(
        () =>
            mode === 'signup'
                ? 'Create your TrueDegree account to continue'
                : 'Sign in to your TrueDegree workspace',
        [mode],
    )

    function resetForm(nextMode) {
        setMode(nextMode)
        setName('')
        setEmail('')
        setPassword('')
        setRole('verifier')
        setError('')
    }

    function handleDemoLogin(selectedRole) {
        const demoUser = getDemoUser(selectedRole)
        if (demoUser) {
            const sessionUser = {
                id: demoUser.id,
                name: demoUser.name,
                email: demoUser.email,
                role: demoUser.role,
                isDemo: true
            }
            localStorage.setItem('truedegree_session', JSON.stringify(sessionUser))
            addActivity({
                type: 'demo-signin',
                title: `${demoUser.name} entered Demo Mode`,
                detail: `${roleMeta[demoUser.role].label} role`,
                actorRole: demoUser.role,
            })
            onAuth(sessionUser)
        }
    }

    function handleSubmit(e) {
        e.preventDefault()
        setError('')

        if (!email || !password || (mode === 'signup' && !name)) {
            setError('Please fill all required fields.')
            return
        }

        const normalizedEmail = email.trim().toLowerCase()
        const users = getUsers()

        if (mode === 'signup') {
            const exists = users.find((u) => u.email === normalizedEmail)
            if (exists) {
                setError('An account with this email already exists. Please sign in.')
                return
            }

            const newUser = {
                id: crypto.randomUUID(),
                name: name.trim(),
                email: normalizedEmail,
                password,
                role,
                createdAt: new Date().toISOString(),
            }
            saveUsers([newUser, ...users])
            const sessionUser = {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
            }
            localStorage.setItem('truedegree_session', JSON.stringify(sessionUser))
            addActivity({
                type: 'account-created',
                title: `${newUser.name} created an account`,
                detail: `${roleMeta[newUser.role].label} role`,
                actorRole: newUser.role,
            })
            onAuth(sessionUser)
            return
        }

        const matched = users.find((u) => u.email === normalizedEmail && u.password === password)
        if (!matched) {
            setError('Invalid email or password.')
            return
        }

        const sessionUser = {
            id: matched.id,
            name: matched.name,
            email: matched.email,
            role: matched.role,
        }
        localStorage.setItem('truedegree_session', JSON.stringify(sessionUser))
        addActivity({
            type: 'signin',
            title: `${matched.name} signed in`,
            detail: `${roleMeta[matched.role].label} role`,
            actorRole: matched.role,
        })
        onAuth(sessionUser)
    }

    return (
        <div className="auth-screen" style={{ position: 'relative', overflow: 'hidden' }}>
            <div className="auth-gradient" />
            
            {/* Antigravity Particles */}
            <div className="antigravity-particles">
                {Array.from({ length: 20 }).map((_, i) => (
                    <div key={i} className="particle"></div>
                ))}
            </div>

            <div className="auth-grid">
                <section className="auth-showcase">
                    <div style={{ fontSize: '90px', background: 'var(--orange-500)', width: '160px', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '40px', margin: '0 auto 32px', boxShadow: 'var(--shadow-neon-orange)', border: '2px solid rgba(255,255,255,0.2)' }}>
                        🎓
                    </div>
                    <span className="hero-tag" style={{ display: 'table', margin: '0 auto 24px' }}>Identity-secured campus credentials</span>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <h1 className="typewriter-smooth">TrueDegree</h1>
                    </div>
                    <p>
                        Issue, verify, and track degree authenticity with blockchain-backed trust.
                        Start by creating an account as an Uploader, Verifier, or Student.
                    </p>
                    <div className="auth-feature-list">
                        <div className="auth-feature">⚡ Fast certificate checks with OCR + hash match</div>
                        <div className="auth-feature">🔗 Tamper-evident records secured on chain</div>
                        <div className="auth-feature">📱 QR verification flow for recruiters</div>
                    </div>
                </section>

                <section className="auth-card">
                    {/* Demo Mode Toggle */}
                    <div className="demo-mode-toggle">
                        <div className="demo-mode-header">
                            <span className="demo-mode-icon">✨</span>
                            <div>
                                <strong>Demo Mode Available</strong>
                                <small>Try the app without credentials</small>
                            </div>
                            <button
                                type="button"
                                className={`demo-toggle-btn ${demoMode ? 'active' : ''}`}
                                onClick={() => setDemoMode(!demoMode)}
                            >
                                {demoMode ? 'Hide' : 'Show'}
                            </button>
                        </div>
                    </div>

                    {/* Demo Mode Selection */}
                    {demoMode && (
                        <div className="demo-mode-selection fade-in">
                            <div className="demo-mode-title">Choose Demo Role</div>
                            <div className="demo-role-cards">
                                {Object.entries(roleMeta).map(([key, meta]) => {
                                    const demoUser = getDemoUser(key)
                                    return (
                                        <button
                                            key={key}
                                            type="button"
                                            className="demo-role-card"
                                            onClick={() => handleDemoLogin(key)}
                                        >
                                            <div className="demo-role-icon">{meta.icon}</div>
                                            <div className="demo-role-info">
                                                <strong>{meta.label}</strong>
                                                <small>{meta.subtitle}</small>
                                                <div className="demo-user-name">{demoUser?.name}</div>
                                            </div>
                                            <div className="demo-role-arrow">→</div>
                                        </button>
                                    )
                                })}
                            </div>
                            <div className="demo-mode-divider">
                                <span>OR</span>
                            </div>
                        </div>
                    )}
                    <div className="auth-tabs">
                        <button
                            type="button"
                            className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
                            onClick={() => resetForm('signup')}
                        >
                            Create Account
                        </button>
                        <button
                            type="button"
                            className={`auth-tab ${mode === 'signin' ? 'active' : ''}`}
                            onClick={() => resetForm('signin')}
                        >
                            Sign In
                        </button>
                    </div>

                    <h2>{mode === 'signup' ? 'Get Started' : 'Welcome Back'}</h2>
                    <p className="auth-subtitle">{subtitle}</p>

                    <form onSubmit={handleSubmit}>
                        {mode === 'signup' && (
                            <div className="form-group">
                                <label className="form-label">Full Name <span className="required">*</span></label>
                                <input
                                    className="form-input"
                                    placeholder="Your full name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label">Email <span className="required">*</span></label>
                            <input
                                className="form-input"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Password <span className="required">*</span></label>
                            <input
                                className="form-input"
                                type="password"
                                placeholder="Enter password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        {mode === 'signup' && (
                            <div className="form-group">
                                <label className="form-label">Role <span className="required">*</span></label>
                                <div className="role-pills">
                                    {Object.entries(roleMeta).map(([key, meta]) => (
                                        <button
                                            key={key}
                                            type="button"
                                            className={`role-pill ${role === key ? 'active' : ''}`}
                                            onClick={() => setRole(key)}
                                        >
                                            <span>{meta.icon}</span>
                                            <div>
                                                <strong>{meta.label}</strong>
                                                <small>{meta.subtitle}</small>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {error && <div className="auth-error">{error}</div>}

                        <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                            {mode === 'signup' ? 'Create Account' : 'Sign In'}
                        </button>
                    </form>
                </section>
            </div>
        </div>
    )
}
