import { useState, useEffect } from 'react'
import './ProcessFlow.css'

export default function ProcessFlow({ type, currentStep, animated = true }) {
  const [steps, setSteps] = useState([])
  const [animatingStep, setAnimatingStep] = useState(-1)

  useEffect(() => {
    const stepDefinitions = {
      admin: [
        { id: 'upload', label: 'Upload Certificate', icon: '📤', description: 'Select PDF certificate file' },
        { id: 'hash', label: 'Generate SHA-256 Hash', icon: '🔐', description: 'Create unique fingerprint' },
        { id: 'details', label: 'Fill Student Details', icon: '📝', description: 'Enter student information' },
        { id: 'mint', label: 'Mint on Blockchain', icon: '⛏️', description: 'Store certificate permanently' }
      ],
      verifier: [
        { id: 'upload', label: 'Upload Certificate', icon: '📎', description: 'Select certificate to verify' },
        { id: 'ocr', label: 'OCR Processing', icon: '🔍', description: 'Extract text from document' },
        { id: 'extract', label: 'Extract Roll Number', icon: '🔑', description: 'Auto-detect roll number' },
        { id: 'verify', label: 'Blockchain Verification', icon: '🛡️', description: 'Check authenticity on-chain' }
      ],
      student: [
        { id: 'search', label: 'Enter Roll Number', icon: '🔎', description: 'Input your roll number' },
        { id: 'query', label: 'Query Blockchain', icon: '⛓️', description: 'Search certificate records' },
        { id: 'display', label: 'Display Credential', icon: '🎓', description: 'Show verified credential' }
      ]
    }

    const selectedSteps = stepDefinitions[type] || []
    const processedSteps = selectedSteps.map((step, index) => ({
      ...step,
      status: index < currentStep ? 'completed' : index === currentStep ? 'active' : 'pending'
    }))
    
    setSteps(processedSteps)

    if (animated && currentStep >= 0 && currentStep < selectedSteps.length) {
      setAnimatingStep(currentStep)
      const timer = setTimeout(() => setAnimatingStep(-1), 600)
      return () => clearTimeout(timer)
    }
  }, [type, currentStep, animated])

  const getStepClass = (step, index) => {
    const baseClass = 'process-step'
    const statusClass = `process-step--${step.status}`
    const animatingClass = animatingStep === index ? 'process-step--animating' : ''
    return [baseClass, statusClass, animatingClass].filter(Boolean).join(' ')
  }

  const getLineClass = (index) => {
    const isCompleted = index < currentStep - 1
    return `process-line ${isCompleted ? 'process-line--completed' : ''}`
  }

  return (
    <div className="process-flow">
      <div className="process-flow-container">
        {steps.map((step, index) => (
          <div key={step.id} className="process-step-wrapper">
            <div className={getStepClass(step, index)}>
              <div className="process-step-icon">
                {step.status === 'completed' ? '✓' : step.icon}
              </div>
              <div className="process-step-content">
                <div className="process-step-label">{step.label}</div>
                <div className="process-step-description">{step.description}</div>
              </div>
              {step.status === 'active' && (
                <div className="process-step-indicator">
                  <div className="process-step-pulse" />
                </div>
              )}
            </div>
            {index < steps.length - 1 && (
              <div className={getLineClass(index)}>
                <div className="process-line-progress" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
