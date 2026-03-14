// Demo data for AcademiaTrust - Sample certificates and users

export const demoUsers = [
  {
    id: 'demo-admin',
    name: 'Dr. Sarah Chen',
    email: 'admin@university.edu',
    role: 'uploader',
    password: 'demo123',
    university: 'Indian Institute of Technology Bombay'
  },
  {
    id: 'demo-verifier',
    name: 'Michael Roberts',
    email: 'hr@techcorp.com',
    role: 'verifier',
    password: 'demo123',
    company: 'TechCorp Solutions'
  },
  {
    id: 'demo-student',
    name: 'Priya Sharma',
    email: 'priya.student@email.com',
    role: 'student',
    password: 'demo123',
    rollNumber: 'BTH2023001'
  }
]

export const demoCertificates = [
  {
    id: 1,
    rollNumber: 'BTH2023001',
    studentName: 'Priya Sharma',
    universityName: 'Indian Institute of Technology Bombay',
    degree: 'B.Tech Computer Science',
    fileHash: 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
    issuedAt: '2023-06-15',
    issuedBy: '0x1234567890123456789012345678901234567890',
    status: 'verified',
    timestamp: '2024-01-15T10:30:00Z',
    verificationType: 'employer'
  },
  {
    id: 2,
    rollNumber: 'BTH2023002',
    studentName: 'Rahul Kumar',
    universityName: 'Indian Institute of Technology Delhi',
    degree: 'M.Tech Artificial Intelligence',
    fileHash: 'b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567',
    issuedAt: '2023-07-20',
    issuedBy: '0x2345678901234567890123456789012345678901',
    status: 'verified',
    timestamp: '2024-01-14T14:22:00Z',
    verificationType: 'student'
  },
  {
    id: 3,
    rollNumber: 'BTH2023003',
    studentName: 'Fake Certificate',
    universityName: 'Unknown University',
    degree: 'Fake Degree',
    fileHash: 'fakehash1234567890abcdef1234567890abcdef1234567890abcdef123456',
    issuedAt: '2023-01-01',
    issuedBy: '0x0000000000000000000000000000000000000000',
    status: 'failed',
    timestamp: '2024-01-13T09:15:00Z',
    verificationType: 'employer',
    reason: 'Hash mismatch - document appears to be tampered'
  },
  {
    id: 4,
    rollNumber: '2411200010023',
    studentName: 'UJJWAL KUMAR',
    universityName: 'SISTER NIVEDITA UNIVERSITY',
    degree: 'BACHELOR OF TECHNOLOGY (COMPUTER SCIENCE & ENGINEERING) (ARTIFICIAL INTELLIGENCE AND MACHINE LEARNING)',
    fileHash: 'c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567890',
    issuedAt: '2025-12-01',
    issuedBy: '0x3456789012345678901234567890123456789012',
    status: 'verified',
    timestamp: '2026-03-15T01:36:12Z',
    verificationType: 'student'
  }
]

export const processSteps = {
  admin: [
    { id: 'upload', label: 'Upload Certificate', icon: '📤', status: 'pending' },
    { id: 'hash', label: 'Generate SHA-256 Hash', icon: '🔐', status: 'pending' },
    { id: 'details', label: 'Fill Student Details', icon: '📝', status: 'pending' },
    { id: 'mint', label: 'Mint on Blockchain', icon: '⛏️', status: 'pending' }
  ],
  verifier: [
    { id: 'upload', label: 'Upload Certificate', icon: '📎', status: 'pending' },
    { id: 'ocr', label: 'OCR Processing', icon: '🔍', status: 'pending' },
    { id: 'extract', label: 'Extract Roll Number', icon: '🔑', status: 'pending' },
    { id: 'verify', label: 'Blockchain Verification', icon: '🛡️', status: 'pending' }
  ],
  student: [
    { id: 'search', label: 'Enter Roll Number', icon: '🔎', status: 'pending' },
    { id: 'query', label: 'Query Blockchain', icon: '⛓️', status: 'pending' },
    { id: 'display', label: 'Display Credential', icon: '🎓', status: 'pending' }
  ]
}

export const getDemoUser = (role) => {
  return demoUsers.find(user => user.role === role)
}

export const getRecentVerifications = () => {
  return demoCertificates.slice(0, 3).map(cert => ({
    ...cert,
    timeAgo: getTimeAgo(cert.timestamp)
  }))
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
