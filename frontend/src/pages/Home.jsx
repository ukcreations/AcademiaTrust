import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDashboardMetrics } from '../utils/activity.js'

const quickLinks = [
    {
        to: '/admin',
        label: 'Issue Degree',
        desc: 'Upload and mint a blockchain degree record.',
        icon: '🏛️',
    },
    {
        to: '/verify',
        label: 'Verify Degree',
        desc: 'Drop a certificate and check authenticity instantly.',
        icon: '🛡️',
    },
    {
        to: '/student',
        label: 'Student Lookup',
        desc: 'Search credentials and view degree metadata.',
        icon: '🎓',
    },
]

export default function Home() {
    const [backendOnline, setBackendOnline] = useState(false)
    const [lastHealthCheck, setLastHealthCheck] = useState('pending')
    const [metrics, setMetrics] = useState({ issued: 0, verified: 0, users: 0 })

    useEffect(() => {
        let mounted = true

        async function runChecks() {
            setMetrics(getDashboardMetrics())
            try {
                const res = await fetch('http://localhost:8000/', { method: 'GET' })
                if (!mounted) return
                setBackendOnline(res.ok)
                setLastHealthCheck(new Date().toLocaleTimeString())
            } catch {
                if (!mounted) return
                setBackendOnline(false)
                setLastHealthCheck(new Date().toLocaleTimeString())
            }
        }

        runChecks()
        const timer = window.setInterval(runChecks, 12000)

        return () => {
            mounted = false
            window.clearInterval(timer)
        }
    }, [])

    const statCards = useMemo(
        () => [
            { icon: '🎓', label: 'Certificates Issued', value: metrics.issued, color: 'orange' },
            { icon: '✅', label: 'Certificates Verified', value: metrics.verified, color: 'green' },
            { icon: '🏫', label: 'Universities Connected', value: metrics.users, color: 'navy' },
            { icon: backendOnline ? '🟢' : '🔴', label: 'Blockchain Status', value: backendOnline ? 'Online' : 'Offline', color: backendOnline ? 'green' : 'orange' },
        ],
        [backendOnline, metrics],
    )

    const qrTarget = 'http://localhost:5173/verify'
    const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(qrTarget)}`

    return (
        <div className="page-content fade-in">
            <div className="hero hero-truedegree">
                <div style={{ fontSize: '72px', background: 'var(--orange-500)', width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '30px', marginBottom: '24px', boxShadow: 'var(--shadow-neon-orange)', border: '2px solid rgba(255,255,255,0.2)' }}>
                    🎓
                </div>
                <div className="hero-tag">
                    <span>TrueDegree Network</span>
                    Live Verification Layer
                </div>
                <h2>
                    Degree Trust,
                    <br />
                    Verified in Seconds.
                </h2>
                <p>
                    A secure dashboard for uploaders, verifiers, and students.
                    Track issuance activity, verify certificate hashes, and share QR-based verification flows.
                </p>
                <div className="hero-actions">
                    <Link to="/admin" className="btn btn-primary btn-lg">Issue Degree</Link>
                    <Link to="/verify" className="btn btn-secondary btn-lg">Verify Degree</Link>
                </div>
            </div>

            <div className="grid-4" style={{ marginBottom: 28 }}>
                {statCards.map((item) => (
                    <div className="stat-card" key={item.label}>
                        <div className={`stat-icon ${item.color}`}>{item.icon}</div>
                        <div>
                            <div className="stat-number">{item.value}</div>
                            <div className="stat-label">{item.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid-2" style={{ gap: 24, alignItems: 'stretch', marginBottom: 28 }}>
                <div className="card">
                    <div className="card-header">
                        <div>
                            <div className="card-title">QR Verification</div>
                            <div className="card-subtitle">Share this QR to route recruiters directly to verification</div>
                        </div>
                    </div>
                    <div className="card-body qr-area">
                        <img src={qrSrc} alt="TrueDegree verification QR code" className="qr-code" />
                        <div>
                            <div style={{ fontWeight: 700, marginBottom: 8 }}>Verification URL</div>
                            <div className="qr-link">{qrTarget}</div>
                            <p style={{ marginTop: 10, color: 'var(--gray-500)', fontSize: 13 }}>
                                Add this QR on offer letters, student cards, or institutional pages for one-scan verification.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <div>
                            <div className="card-title">Network Health</div>
                            <div className="card-subtitle">Backend and chain availability pulse</div>
                        </div>
                    </div>
                    <div className="card-body">
                        <div className={`network-chip ${backendOnline ? 'ok' : 'down'}`}>
                            <span className="chain-dot" />
                            {backendOnline ? 'API / RPC reachable' : 'API or RPC not reachable'}
                        </div>
                        <div style={{ marginTop: 16, color: 'var(--gray-500)', fontSize: 13 }}>
                            Last check: {lastHealthCheck}
                        </div>
                        <div className="divider" />
                        <p style={{ color: 'var(--gray-600)', fontSize: 14, lineHeight: 1.7 }}>
                            If this status is offline, start backend with <code>uvicorn main:app --reload --port 8000</code>
                            and keep your local Hardhat node running for on-chain actions.
                        </p>
                    </div>
                </div>
            </div>

            <div className="page-header">
                <h2>Workspace</h2>
                <p>Move quickly between issuing, verification, and student lookup workflows.</p>
            </div>

            <div className="portal-cards">
                {quickLinks.map((item) => (
                    <Link key={item.to} to={item.to} className="portal-card">
                        <div className="portal-card-icon" style={{ background: 'rgba(249,115,22,.12)' }}>{item.icon}</div>
                        <h3>{item.label}</h3>
                        <p>{item.desc}</p>
                    </Link>
                ))}
            </div>
        </div>
    )
}
