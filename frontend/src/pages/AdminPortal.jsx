import { useState } from 'react'
import FileDropzone from '../components/FileDropzone.jsx'
import ProcessFlow from '../components/ProcessFlow.jsx'
import SampleOutputs from '../components/SampleOutputs.jsx'
import { api } from '../services/api.js'
import { addActivity } from '../utils/activity.js'

const STEPS = ['Upload File', 'View Hash', 'Fill Details', 'Mint on Chain']

export default function AdminPortal() {
    const [file, setFile] = useState(null)
    const [hash, setHash] = useState('')
    const [hashLoading, setHashLoading] = useState(false)
    const [rollNumber, setRollNumber] = useState('')
    const [studentName, setStudentName] = useState('')
    const [university, setUniversity] = useState('')
    const [degree, setDegree] = useState('')
    const [minting, setMinting] = useState(false)
    const [txHash, setTxHash] = useState('')
    const [error, setError] = useState('')

    // Calculate current step for ProcessFlow
    const getCurrentStep = () => {
        if (!file) return 0
        if (!hash) return 1
        if (!rollNumber || !studentName || !university || !degree) return 2
        return 3
    }

    const currentStep = getCurrentStep()

    async function handleSampleSelect(sample) {
        // Auto-fill form with sample data
        setRollNumber(sample.rollNumber)
        setStudentName(sample.studentName)
        setUniversity(sample.universityName)
        setDegree(sample.degree)
        // Note: In demo mode, we'll simulate the file and hash
        setHash(sample.fileHash)
        addActivity({
            type: 'sample-used',
            title: 'Sample certificate loaded',
            detail: `Pre-filled data for ${sample.studentName}`,
            actorRole: 'uploader',
        })
        // Show toast notification
        if (window.addToast) {
            window.addToast(`Sample data loaded for ${sample.studentName}`, 'success', 3000)
        }
    }

    const step = !file ? 0 : !hash ? 1 : (!rollNumber || !studentName || !university || !degree) ? 2 : 3

    async function handleFile(f) {
        setFile(f)
        setHash('')
        setTxHash('')
        setError('')
        setHashLoading(true)
        try {
            const res = await api.hashFile(f)
            setHash(res.sha256)
        } catch (e) {
            setError('Failed to compute hash. Check the backend is running.')
        } finally {
            setHashLoading(false)
        }
    }

    async function handleMint() {
        if (!hash || !rollNumber || !studentName || !university || !degree) return
        setMinting(true)
        setError('')
        try {
            const res = await api.issueCertificate({ roll_number: rollNumber, student_name: studentName, university_name: university, degree, file_hash: hash })
            setTxHash(res.tx_hash)
            addActivity({
                type: 'issue-success',
                title: `Degree issued for ${studentName}`,
                detail: `Roll ${rollNumber} minted on chain`,
                actorRole: 'uploader',
            })
        } catch (e) {
            setError(e?.response?.data?.detail || 'Minting failed. Check .env settings.')
        } finally {
            setMinting(false)
        }
    }

    const stepState = (i) => i < step ? 'done' : i === step ? 'active' : 'pending'

    return (
        <div className="page-content fade-in">
            <div className="page-header">
                <h2>Issue Degree</h2>
                <p>Upload a student's degree, compute its SHA-256 hash, and mint it permanently on the blockchain.</p>
            </div>

            {/* Process Flow */}
            <ProcessFlow type="admin" currentStep={currentStep} />

            {/* Alert */}
            <div className="alert alert-info">
                <span>ℹ️</span>
                <span>Make sure the Hardhat local node is running and your <code>.env</code> has the correct <code>CONTRACT_ADDRESS</code> and <code>PRIVATE_KEY</code> before minting.</span>
            </div>

            {/* Steps */}
            <div className="steps" style={{ marginBottom: 28 }}>
                {STEPS.map((label, i) => (
                    <div key={label} style={{ display: 'contents' }}>
                        <div className={`step ${stepState(i)}`}>
                            <div className="step-num">
                                {stepState(i) === 'done' ? '✓' : i + 1}
                            </div>
                            <div className="step-label">{label}</div>
                        </div>
                        {i < STEPS.length - 1 && <div className={`step-line ${stepState(i) === 'done' ? 'done' : ''}`} />}
                    </div>
                ))}
            </div>

            <div className="grid-3" style={{ gap: 24 }}>
                {/* Left: Upload */}
                <div className="card">
                    <div className="card-header">
                        <div>
                            <div className="card-title">📤 Step 1 — Upload Certificate</div>
                            <div className="card-subtitle">PDF or image of the original degree</div>
                        </div>
                    </div>
                    <div className="card-body">
                        <FileDropzone
                            onFile={handleFile}
                            label="Drop the student's certificate here"
                        />

                        {hashLoading && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, color: 'var(--gray-500)' }}>
                                <div className="spinner" style={{ borderTopColor: 'var(--orange-500)', borderColor: 'var(--gray-200)' }} />
                                Computing SHA-256 hash…
                            </div>
                        )}

                        {hash && (
                            <div className="hash-box">
                                <span className="hash-label">SHA-256</span>
                                <span className="hash-value">{hash}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Middle: Forms */}
                <div className="card">
                    <div className="card-header">
                        <div>
                            <div className="card-title">📝 Step 2 — Certificate Details</div>
                            <div className="card-subtitle">Fill student info to store on-chain</div>
                        </div>
                    </div>
                    <div className="card-body">
                        <div className="form-group">
                            <label className="form-label">Roll Number <span className="required">*</span></label>
                            <input className="form-input" placeholder="e.g. BTH20200123" value={rollNumber} onChange={e => setRollNumber(e.target.value)} />
                            <div className="form-hint">Unique identifier from university records</div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Student Full Name <span className="required">*</span></label>
                            <input className="form-input" placeholder="e.g. Priya Sharma" value={studentName} onChange={e => setStudentName(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">University Name <span className="required">*</span></label>
                            <input className="form-input" placeholder="e.g. IIT Bombay" value={university} onChange={e => setUniversity(e.target.value)} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Degree Title <span className="required">*</span></label>
                            <input className="form-input" placeholder="e.g. B.Tech Computer Science" value={degree} onChange={e => setDegree(e.target.value)} />
                        </div>
                    </div>
                </div>

                {/* Right: Sample Outputs */}
                <SampleOutputs onSelectSample={handleSampleSelect} currentPortal="admin" />
            </div>

            {/* Mint Button */}
            <div className="card" style={{ marginTop: 24 }}>
                <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--gray-900)' }}>🔗 Step 3 — Mint on Blockchain</div>
                        <div style={{ fontSize: 13, color: 'var(--gray-400)', marginTop: 4 }}>
                            This will create an immutable on-chain record. Action cannot be undone.
                        </div>
                    </div>
                    <button
                        className="btn btn-primary btn-lg"
                        onClick={handleMint}
                        disabled={!hash || !rollNumber || !studentName || !university || !degree || minting}
                    >
                        {minting ? <><div className="spinner" /> Minting…</> : '⛏️  Mint Certificate'}
                    </button>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="result-panel failed fade-in" style={{ marginTop: 20 }}>
                    <div className="result-icon err">❌</div>
                    <div className="result-title err">Error</div>
                    <div className="result-message">{error}</div>
                </div>
            )}

            {/* Success */}
            {txHash && (
                <div className="result-panel verified fade-in" style={{ marginTop: 20 }}>
                    <div className="result-icon ok">🎉</div>
                    <div className="result-title ok">Certificate Minted!</div>
                    <div className="result-message">Successfully stored on the blockchain.</div>
                    <div style={{ marginTop: 20 }}>
                        <div className="cert-details" style={{ maxWidth: 500, margin: '0 auto' }}>
                            <div className="cert-details-row"><span className="cert-details-key">Roll Number</span><span className="cert-details-val">{rollNumber}</span></div>
                            <div className="cert-details-row"><span className="cert-details-key">Student</span><span className="cert-details-val">{studentName}</span></div>
                            <div className="cert-details-row"><span className="cert-details-key">University</span><span className="cert-details-val">{university}</span></div>
                            <div className="cert-details-row"><span className="cert-details-key">Degree</span><span className="cert-details-val">{degree}</span></div>
                            <div className="cert-details-row"><span className="cert-details-key">SHA-256 Hash</span><span className="cert-details-val" style={{ fontSize: 11 }}>{hash}</span></div>
                        </div>
                        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
                            <a
                                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="tx-link"
                            >
                                🔗 View on Etherscan
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
