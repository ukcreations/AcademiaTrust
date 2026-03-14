import { useState } from 'react'
import FileDropzone from '../components/FileDropzone.jsx'
import ProcessFlow from '../components/ProcessFlow.jsx'
import SampleOutputs from '../components/SampleOutputs.jsx'
import { api } from '../services/api.js'
import { addActivity } from '../utils/activity.js'

export default function VerifierPortal() {
    const [file, setFile] = useState(null)
    const [rollNumber, setRollNumber] = useState('')
    const [ocrLoading, setOcrLoading] = useState(false)
    const [verifying, setVerifying] = useState(false)
    const [result, setResult] = useState(null)
    const [ocrText, setOcrText] = useState('')
    const [ocrConf, setOcrConf] = useState('')
    const [error, setError] = useState('')

    // Calculate current step for ProcessFlow
    const getCurrentStep = () => {
        if (!file) return 0
        if (ocrLoading) return 1
        if (!rollNumber) return 2
        if (verifying) return 3
        return result ? 4 : 3
    }

    const currentStep = getCurrentStep()

    async function handleSampleSelect(sample) {
        // Auto-fill form with sample data
        setRollNumber(sample.rollNumber)
        // In demo mode, simulate OCR processing
        setOcrText(`Student Name: ${sample.studentName}\nRoll Number: ${sample.rollNumber}\nDegree: ${sample.degree}\nUniversity: ${sample.universityName}`)
        setOcrConf('high')
        addActivity({
            type: 'sample-used',
            title: 'Sample certificate loaded for verification',
            detail: `Pre-filled data for ${sample.studentName}`,
            actorRole: 'verifier',
        })
        // Show toast notification
        if (window.addToast) {
            window.addToast(`Sample loaded: ${sample.studentName}`, 'info', 3000)
        }
    }

    async function handleFile(f) {
        setFile(f)
        setResult(null)
        setError('')
        setOcrLoading(true)
        try {
            const res = await api.ocrFile(f)
            setOcrText(res.raw_text?.slice(0, 400) || '')
            setOcrConf(res.confidence || '')
            if (res.roll_number) setRollNumber(res.roll_number)
        } catch {
            setError('OCR failed. Ensure Tesseract is installed and the backend is running.')
        } finally {
            setOcrLoading(false)
        }
    }

    async function handleVerify() {
        if (!file || !rollNumber) return
        setVerifying(true)
        setResult(null)
        setError('')
        try {
            const res = await api.verifyCertificate(file, rollNumber)
            setResult(res)
            addActivity({
                type: res.verified ? 'verify-success' : 'verify-failed',
                title: `Verification ${res.verified ? 'passed' : 'failed'} for ${rollNumber}`,
                detail: res.verified
                    ? `Authenticated: ${res.student_name || 'certificate owner'}`
                    : 'Hash mismatch or certificate not found',
                actorRole: 'verifier',
            })
        } catch (e) {
            setError(e?.response?.data?.detail || 'Verification failed. Check backend connection.')
        } finally {
            setVerifying(false)
        }
    }

    const confColor = { high: 'var(--green-600)', medium: 'var(--orange-500)', low: 'var(--red-600)' }

    return (
        <div className="page-content fade-in">
            <div className="page-header">
                <h2>Verify Degree</h2>
                <p>Upload a certificate from a job applicant. OCR extracts the Roll Number — blockchain confirms authenticity.</p>
            </div>

            {/* Process Flow */}
            <ProcessFlow type="verifier" currentStep={currentStep} />

            <div className="alert alert-warn">
                <span>⚡</span>
                <span>For best OCR results, upload a high-quality scan (300 DPI+). Blurry or low-contrast images may reduce accuracy.</span>
            </div>

            <div className="grid-3" style={{ gap: 24, alignItems: 'start' }}>
                {/* Left: Upload */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div className="card">
                        <div className="card-header">
                            <div>
                                <div className="card-title">📎 Upload Applicant Certificate</div>
                                <div className="card-subtitle">OCR will auto-extract the Roll Number</div>
                            </div>
                        </div>
                        <div className="card-body">
                            <FileDropzone onFile={handleFile} label="Drop applicant's certificate here" />

                            {ocrLoading && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, color: 'var(--gray-500)' }}>
                                    <div className="spinner" style={{ borderTopColor: 'var(--orange-500)', borderColor: 'var(--gray-200)' }} />
                                    Running Tesseract OCR…
                                </div>
                            )}

                            {ocrText && (
                                <div style={{ marginTop: 16 }}>
                                    <div className="form-label" style={{ marginBottom: 8 }}>
                                        OCR Output Preview
                                        {ocrConf && (
                                            <span className={`pill pill-${ocrConf === 'high' ? 'green' : ocrConf === 'medium' ? 'orange' : 'gray'}`} style={{ marginLeft: 8, fontSize: 11 }}>
                                                {ocrConf} confidence
                                            </span>
                                        )}
                                    </div>
                                    <div style={{
                                        background: 'var(--gray-900)', color: 'var(--orange-300)', fontFamily: 'monospace',
                                        fontSize: 11, padding: '12px 14px', borderRadius: 'var(--radius-md)', lineHeight: 1.7,
                                        maxHeight: 120, overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all'
                                    }}>
                                        {ocrText}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <div>
                                <div className="card-title">🔑 Roll Number</div>
                                <div className="card-subtitle">Auto-filled by OCR, or enter manually</div>
                            </div>
                        </div>
                        <div className="card-body">
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <input
                                    className="form-input"
                                    placeholder="e.g. BTH20200123"
                                    value={rollNumber}
                                    onChange={e => setRollNumber(e.target.value)}
                                />
                                <div className="form-hint">
                                    {rollNumber ? `✓ Using roll number: ${rollNumber}` : 'OCR will attempt to auto-fill this'}
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        className="btn btn-primary btn-lg"
                        onClick={handleVerify}
                        disabled={!file || !rollNumber || verifying}
                        style={{ width: '100%' }}
                    >
                        {verifying
                            ? <><div className="spinner" /> Verifying on Blockchain…</>
                            : '🛡️  Verify Degree Now'}
                    </button>
                </div>

                {/* Middle: Result */}
                <div>
                    {!result && !error && (
                        <div className="card" style={{ textAlign: 'center', padding: '60px 32px' }}>
                            <div style={{ fontSize: 56, marginBottom: 16 }}>🔍</div>
                            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--gray-700)' }}>Awaiting Verification</div>
                            <div style={{ fontSize: 14, color: 'var(--gray-400)', marginTop: 8, lineHeight: 1.6 }}>
                                Upload a certificate and click <strong>Verify</strong> to check it against the blockchain.
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="result-panel failed fade-in">
                            <div className="result-icon err">⚠️</div>
                            <div className="result-title err">Error</div>
                            <div className="result-message">{error}</div>
                        </div>
                    )}

                    {result && (
                        <div className={`result-panel ${result.verified ? 'verified' : 'failed'} fade-in`}>
                            <div className={`result-icon ${result.verified ? 'ok' : 'err'}`}>
                                {result.verified ? '✅' : '❌'}
                            </div>
                            <div className={`result-title ${result.verified ? 'ok' : 'err'}`}>
                                {result.verified ? 'AUTHENTIC — VERIFIED' : 'TAMPERED / FAKE'}
                            </div>
                            <div className="result-message">{result.message}</div>

                            {result.verified && (
                                <div className="cert-details" style={{ marginTop: 24 }}>
                                    {[
                                        { k: 'Roll Number', v: result.roll_number },
                                        { k: 'Student', v: result.student_name },
                                        { k: 'University', v: result.university_name },
                                        { k: 'Degree', v: result.degree },
                                        { k: 'Issued At', v: result.issued_at },
                                        { k: 'Issued By', v: result.issued_by, mono: true },
                                    ].filter(r => r.v).map(r => (
                                        <div key={r.k} className="cert-details-row">
                                            <span className="cert-details-key">{r.k}</span>
                                            <span className="cert-details-val" style={r.mono ? { fontSize: 11, fontFamily: 'monospace' } : {}}>{r.v}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {!result.verified && (
                                <div style={{ marginTop: 20 }}>
                                    <div style={{ fontSize: 13, color: 'var(--red-600)', fontWeight: 600 }}>
                                        Hash submitted: <span style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{result.submitted_hash?.slice(0, 32)}…</span>
                                    </div>
                                    <div style={{ marginTop: 8, fontSize: 13, color: 'var(--gray-600)' }}>
                                        This certificate was not found on the blockchain, or its file has been tampered with.
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right: Sample Outputs */}
                <SampleOutputs onSelectSample={handleSampleSelect} currentPortal="verifier" />
            </div>
        </div>
    )
}
