import { useState } from 'react'
import { demoCertificates } from '../utils/demoData.js'
import './SampleOutputs.css'

export default function SampleOutputs({ onSelectSample, currentPortal }) {
  const [selectedSample, setSelectedSample] = useState(null)

  const getPortalSamples = () => {
    // Filter samples based on current portal
    return demoCertificates.slice(0, 3).map(cert => ({
      ...cert,
      timeAgo: getTimeAgo(cert.timestamp)
    }))
  }

  const handleSampleClick = (sample) => {
    setSelectedSample(sample.id)
    if (onSelectSample) {
      onSelectSample(sample)
    }
    
    // Reset selection after a moment
    setTimeout(() => setSelectedSample(null), 2000)
  }

  const getStatusIcon = (status) => {
    return status === 'verified' ? '✅' : '❌'
  }

  const getStatusColor = (status) => {
    return status === 'verified' ? 'success' : 'failed'
  }

  const samples = getPortalSamples()

  return (
    <div className="sample-outputs">
      <div className="sample-outputs-header">
        <div className="sample-outputs-title">
          <span className="sample-outputs-icon">📋</span>
          Recent Verifications
        </div>
        <div className="sample-outputs-subtitle">
          Click any sample to auto-fill the form
        </div>
      </div>
      
      <div className="sample-list">
        {samples.map((sample) => (
          <div
            key={sample.id}
            className={`sample-card ${selectedSample === sample.id ? 'sample-card--selected' : ''}`}
            onClick={() => handleSampleClick(sample)}
          >
            <div className="sample-card-header">
              <div className="sample-card-status">
                <span className={`sample-status-icon sample-status-${getStatusColor(sample.status)}`}>
                  {getStatusIcon(sample.status)}
                </span>
                <span className={`sample-status-text sample-status-${getStatusColor(sample.status)}`}>
                  {sample.status === 'verified' ? 'Authentic' : 'Tampered'}
                </span>
              </div>
              <div className="sample-card-time">{sample.timeAgo}</div>
            </div>
            
            <div className="sample-card-content">
              <div className="sample-card-info">
                <div className="sample-card-name">{sample.studentName}</div>
                <div className="sample-card-details">
                  <span className="sample-card-roll">{sample.rollNumber}</span>
                  <span className="sample-card-degree">{sample.degree}</span>
                </div>
                <div className="sample-card-university">{sample.universityName}</div>
              </div>
              
              <div className="sample-card-meta">
                <div className="sample-card-hash">
                  <span className="sample-hash-label">Hash:</span>
                  <span className="sample-hash-value">
                    {sample.fileHash.slice(0, 12)}...{sample.fileHash.slice(-6)}
                  </span>
                </div>
                <div className="sample-card-type">
                  {sample.verificationType === 'employer' ? '🏢' : '👤'} {sample.verificationType}
                </div>
              </div>
            </div>
            
            <div className="sample-card-action">
              <span className="sample-action-text">
                {selectedSample === sample.id ? '✓ Selected' : 'Click to use'}
              </span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="sample-outputs-footer">
        <div className="sample-footer-text">
          <span className="sample-footer-icon">💡</span>
          These are sample verifications from the demo environment
        </div>
      </div>
    </div>
  )
}

function getTimeAgo(timestamp) {
  const now = new Date()
  const past = new Date(timestamp)
  const diffMs = now - past
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 60) return `${diffMins} minutes ago`
  if (diffHours < 24) return `${diffHours} hours ago`
  return `${diffDays} days ago`
}
