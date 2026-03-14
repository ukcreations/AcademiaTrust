import { useState, useEffect } from 'react'
import './ToastNotifications.css'

export default function ToastNotifications() {
  const [toasts, setToasts] = useState([])

  // Global function to add toast (will be attached to window)
  useEffect(() => {
    window.addToast = (message, type = 'info', duration = 3000) => {
      const id = Date.now()
      const newToast = { id, message, type }
      
      setToasts(prev => [...prev, newToast])
      
      // Auto remove after duration
      setTimeout(() => {
        setToasts(prev => prev.filter(toast => toast.id !== id))
      }, duration)
    }

    return () => {
      delete window.addToast
    }
  }, [])

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const getIcon = (type) => {
    switch (type) {
      case 'success': return '✅'
      case 'error': return '❌'
      case 'warning': return '⚠️'
      case 'info': return 'ℹ️'
      default: return 'ℹ️'
    }
  }

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast--${toast.type}`}
          onClick={() => removeToast(toast.id)}
        >
          <span className="toast-icon">{getIcon(toast.type)}</span>
          <span className="toast-message">{toast.message}</span>
          <button className="toast-close" onClick={() => removeToast(toast.id)}>
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
