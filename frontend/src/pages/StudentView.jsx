import { useState } from 'react'
import ProcessFlow from '../components/ProcessFlow.jsx'
import SampleOutputs from '../components/SampleOutputs.jsx'
import { api } from '../services/api.js'
import { addActivity } from '../utils/activity.js'

export default function StudentView() {
    const [rollNumber, setRollNumber] = useState('')
    const [loading, setLoading] = useState(false)
    const [credential, setCredential] = useState(null)
    const [notFound, setNotFound] = useState(false)
    const [error, setError] = useState('')

    // Calculate current step for ProcessFlow
    const getCurrentStep = () => {
        if (!rollNumber) return 0
        if (loading) return 1
        if (credential) return 2
        if (notFound) return 2
        return 1
    }

    const currentStep = getCurrentStep()

    async function handleSampleSelect(sample) {
        // Auto-fill form with sample data
        setRollNumber(sample.rollNumber)
        addActivity({
            type: 'sample-used',
            title: 'Sample roll number loaded',
            detail: `Pre-filled data for ${sample.studentName}`,
            actorRole: 'student',
        })
        // Show toast notification
        if (window.addToast) {
            window.addToast(`Roll number loaded: ${sample.rollNumber}`, 'info', 3000)
        }
        // Trigger lookup after a short delay
        setTimeout(() => {
            const mockEvent = { preventDefault: () => {} }
            handleLookup(mockEvent)
        }, 500)
    }

    async function handleLookup(e) {
        e.preventDefault()
        if (!rollNumber) return
        setLoading(true)
        setCredential(null)
        setNotFound(false)
        setError('')
        try {
            const res = await api.lookupCertificate(rollNumber)
            if (res.exists) {
                setCredential(res)
            } else {
                setNotFound(true)
            }
        } catch (e) {
            setError('Lookup failed. Check the backend is running.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="page-content fade-in">
            <div className="page-header">
                <h2>Student Lookup</h2>
                <p>Look up your Soulbound blockchain credential by Roll Number.</p>
            </div>

            {/* Process Flow */}
            <ProcessFlow type="student" currentStep={currentStep} />

            <div className="grid-3" style={{ gap: 24, alignItems: 'start' }}>
                {/* Left: Search */}
                <div className="card">
                    <div className="card-header">
                        <div>
                            <div className="card-title">🔎 Find Your Credential</div>
                            <div className="card-subtitle">Enter your roll number to search</div>
                        </div>
                    </div>
                    <div className="card-body">
                        <form onSubmit={handleLookup} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <input
                                className="form-input"
                                placeholder="Enter your Roll Number (e.g. BTH20200123)"
                                value={rollNumber}
                                onChange={e => setRollNumber(e.target.value)}
                            />
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={!rollNumber || loading}
                            >
                                {loading ? <><div className="spinner" /> Searching…</> : 'Look Up'}
                            </button>
                        </form>
                        <div className="form-hint" style={{ marginTop: 10 }}>
                            Your Roll Number is on your physical certificate and was provided by your university admin.
                        </div>
                    </div>
                </div>

                {/* Middle: Result */}
                <div>
                    {/* Error */}
                    {error && (
                        <div className="result-panel failed fade-in">
                            <div className="result-icon err">⚠️</div>
                            <div className="result-title err">Error</div>
                            <div className="result-message">{error}</div>
                        </div>
                    )}

                    {/* Not found */}
                    {notFound && (
                        <div className="card fade-in" style={{ textAlign: 'center', padding: '48px 32px' }}>
                            <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
                            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--gray-700)' }}>No Record Found</div>
                            <div style={{ fontSize: 14, color: 'var(--gray-400)', marginTop: 8, lineHeight: 1.6 }}>
                                No certificate found for roll number <strong>{rollNumber}</strong>.<br />
                                Contact your university admin to issue your certificate.
                            </div>
                        </div>
                    )}

                    {/* Credential Card */}
                    {credential && (
                        <div className="fade-in">
                            <div className="credential-card">
                                <div className="credential-watermark">🎓</div>

                                <div className="credential-header">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div className="credential-badge">
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                                            SOULBOUND
                                        </div>
                                    </div>
                                    <div className="credential-seal">🎓</div>
                                </div>

                                <div style={{ marginBottom: 8 }}>
                                    <div className="credential-student">{credential.student_name}</div>
                                    <div className="credential-degree">{credential.degree}</div>
                                    <div className="credential-uni">{credential.university_name}</div>
                                </div>

                                <div className="credential-divider" />

                                <div className="credential-meta">
                                    <div className="credential-meta-item">
                                        <label>Roll Number</label>
                                        <p>{credential.roll_number}</p>
                                    </div>
                                    <div className="credential-meta-item">
                                        <label>Issued At</label>
                                        <p>{credential.issued_at || '—'}</p>
                                    </div>
                                    <div className="credential-meta-item" style={{ gridColumn: '1/-1' }}>
                                        <label>SHA-256 Hash (File Fingerprint)</label>
                                        <p style={{ fontSize: 11, fontFamily: 'monospace', wordBreak: 'break-all' }}>
                                            {credential.file_hash}
                                        </p>
                                    </div>
                                    <div className="credential-meta-item" style={{ gridColumn: '1/-1' }}>
                                        <label>Issued By (Wallet)</label>
                                        <p style={{ fontSize: 11, fontFamily: 'monospace' }}>{credential.issued_by}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
                                <a
                                    href={`https://sepolia.etherscan.io/address/${credential.issued_by}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="tx-link"
                                >
                                    🔗 View Issuer on Etherscan
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                                </a>
                                <div className="alert alert-info" style={{ flex: 1, marginBottom: 0 }}>
                                    <span>🛡️</span>
                                    <span style={{ fontSize: 13 }}>This credential is <strong>Soulbound</strong> — it cannot be transferred, deleted, or forged.</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Sample Outputs */}
                <SampleOutputs onSelectSample={handleSampleSelect} currentPortal="student" />
            </div>
        </div>
    )
}
