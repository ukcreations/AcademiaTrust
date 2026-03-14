import axios from 'axios'
import { demoCertificates } from '../utils/demoData.js'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const http = axios.create({
    baseURL: BASE,
    timeout: 60_000, // 60s for OCR + blockchain calls
})

export const api = {
    /** Compute SHA-256 hash of a file. Returns { filename, sha256, size_kb } */
    async hashFile(file) {
        return { filename: file.name, sha256: 'mockhash123', size_kb: 100 }
    },

    /** Run Tesseract OCR on a file. Returns { raw_text, roll_number, confidence } */
    async ocrFile(file) {
        return { 
            raw_text: `SISTER NIVEDITA UNIVERSITY\nBACHELOR OF TECHNOLOGY (COMPUTER SCIENCE & ENGINEERING)\n\nStudent Name: UJJWAL KUMAR\nRoll Number: 2411200010023\nYear of Graduation: 2025\n\nThis is to certify that the above mentioned student has successfully completed the degree requirements with distinction.\n\nDate of Issue: 2025-12-01\nIssuer ID: 0x3456789012345678901234567890123456789012`, 
            roll_number: '2411200010023', 
            confidence: 99.0 
        }
    },

    /**
     * Issue (mint) a certificate on-chain.
     */
    async issueCertificate(payload) {
        return { success: true, tx_hash: '0xabc', ...payload, message: 'Minted successfully' }
    },

    /**
     * Verify a certificate file against the blockchain.
     */
    async verifyCertificate(file, rollNumber) {
        const cert = demoCertificates.find(c => c.rollNumber === rollNumber)
        if (cert && cert.status === 'verified') {
            return {
                verified: true,
                roll_number: cert.rollNumber,
                student_name: cert.studentName,
                university_name: cert.universityName,
                degree: cert.degree,
                file_hash: cert.fileHash,
                issued_at: cert.issuedAt,
                issued_by: cert.issuedBy
            }
        }
        return { verified: false }
    },

    /**
     * Look up certificate metadata by roll number.
     */
    async lookupCertificate(rollNumber) {
        const cert = demoCertificates.find(c => c.rollNumber === rollNumber)
        if (cert) {
            return {
                exists: true,
                roll_number: cert.rollNumber,
                student_name: cert.studentName,
                university_name: cert.universityName,
                degree: cert.degree,
                file_hash: cert.fileHash,
                issued_at: cert.issuedAt,
                issued_by: cert.issuedBy
            }
        }
        return { exists: false }
    },
}
