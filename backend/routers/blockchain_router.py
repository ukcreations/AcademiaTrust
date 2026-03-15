"""
routers/blockchain_router.py — Issue & Verify certificate on-chain
"""
import hashlib
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from typing import Optional

from services.blockchain_service import (
    issue_certificate_on_chain,
    verify_certificate_on_chain,
    get_certificate_details,
)
from services.ocr_service import extract_text_from_bytes, validate_certificate_format

router = APIRouter()


# ── Response Models ─────────────────────────────────────────────────────────

class IssueRequest(BaseModel):
    roll_number:     str
    student_name:    str
    university_name: str
    degree:          str
    file_hash:       str   # SHA-256 hex (64 chars) — precomputed by frontend


class IssueResponse(BaseModel):
    success:      bool
    tx_hash:      Optional[str]
    roll_number:  str
    file_hash:    str
    message:      str


class VerifyResponse(BaseModel):
    verified:        bool
    roll_number:     str
    submitted_hash:  str
    student_name:    Optional[str]
    university_name: Optional[str]
    degree:          Optional[str]
    issued_at:       Optional[str]
    issued_by:       Optional[str]
    message:         str


class LookupResponse(BaseModel):
    exists:          bool
    roll_number:     str
    student_name:    Optional[str]
    university_name: Optional[str]
    degree:          Optional[str]
    file_hash:       Optional[str]
    issued_at:       Optional[str]
    issued_by:       Optional[str]


class OCRValidationResponse(BaseModel):
    is_valid_format: bool
    message: str
    detected_type: Optional[str]  # "certificate" or "mark_sheet"
    confidence: Optional[str]


# ── Routes ──────────────────────────────────────────────────────────────────

@router.post("/issue", response_model=IssueResponse, summary="Issue (Mint) certificate on blockchain")
async def issue_certificate(payload: IssueRequest):
    """
    Stores a certificate hash on the smart contract.
    The file_hash must be the SHA-256 hex digest (64 chars) of the original certificate file.
    Called by the University Admin portal.
    """
    if len(payload.file_hash) != 64:
        raise HTTPException(status_code=400, detail="file_hash must be a 64-char SHA-256 hex string")

    try:
        tx_hash = await issue_certificate_on_chain(
            roll_number=payload.roll_number,
            file_hash=payload.file_hash,
            student_name=payload.student_name,
            university_name=payload.university_name,
            degree=payload.degree,
        )
        return IssueResponse(
            success=True,
            tx_hash=tx_hash,
            roll_number=payload.roll_number,
            file_hash=payload.file_hash,
            message=f"Certificate minted successfully. Tx: {tx_hash}",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Blockchain error: {str(e)}")


@router.post("/verify", response_model=VerifyResponse, summary="Verify certificate against blockchain")
async def verify_certificate(
    file:        UploadFile = File(...),
    roll_number: str        = Form(...),
):
    """
    Upload a certificate file + provide the roll number.
    The backend computes the SHA-256 hash of the uploaded file and checks it
    against the on-chain record for that roll number.
    Called by the Recruiter Verification portal.
    """
    file_bytes = await file.read()
    submitted_hash = hashlib.sha256(file_bytes).hexdigest()

    # First validate certificate format using OCR
    try:
        ocr_text = await extract_text_from_bytes(file_bytes, file.content_type)
        is_valid_format, validation_message = validate_certificate_format(ocr_text)
        
        if not is_valid_format:
            return VerifyResponse(
                verified=False,
                roll_number=roll_number,
                submitted_hash=submitted_hash,
                student_name=None,
                university_name=None,
                degree=None,
                issued_at=None,
                issued_by=None,
                message=f"❌ Invalid document format: {validation_message}",
            )
    except Exception as e:
        # If OCR fails, proceed with blockchain verification but note the issue
        pass

    try:
        verified, details = await verify_certificate_on_chain(
            roll_number=roll_number,
            file_hash=submitted_hash,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Verification error: {str(e)}")

    if verified and details:
        return VerifyResponse(
            verified=True,
            roll_number=roll_number,
            submitted_hash=submitted_hash,
            student_name=details.get("student_name"),
            university_name=details.get("university_name"),
            degree=details.get("degree"),
            issued_at=details.get("issued_at"),
            issued_by=details.get("issued_by"),
            message="✅ Certificate is AUTHENTIC and matches the blockchain record.",
        )
    else:
        return VerifyResponse(
            verified=False,
            roll_number=roll_number,
            submitted_hash=submitted_hash,
            student_name=None,
            university_name=None,
            degree=None,
            issued_at=None,
            issued_by=None,
            message="❌ Certificate NOT FOUND or TAMPERED: No matching record found on blockchain.",
        )


@router.get("/certificate/{roll_number}", response_model=LookupResponse, summary="Lookup certificate by roll number")
async def lookup_certificate(roll_number: str):
    """
    Returns certificate metadata stored on-chain for a given roll number.
    Used by the Student View portal.
    """
    try:
        details = await get_certificate_details(roll_number)
        if not details:
            return LookupResponse(
                exists=False,
                roll_number=roll_number,
                student_name=None,
                university_name=None,
                degree=None,
                file_hash=None,
                issued_at=None,
                issued_by=None,
            )
        return LookupResponse(
            exists=True,
            roll_number=roll_number,
            student_name=details["student_name"],
            university_name=details["university_name"],
            degree=details["degree"],
            file_hash=details["file_hash"],
            issued_at=details["issued_at"],
            issued_by=details["issued_by"],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lookup error: {str(e)}")


@router.post("/validate-format", response_model=OCRValidationResponse, summary="Validate certificate/mark sheet format")
async def validate_document_format(file: UploadFile = File(...)):
    """
    Validates if the uploaded document is a valid certificate or mark sheet.
    Uses OCR to extract text and validate format.
    """
    file_bytes = await file.read()
    
    try:
        ocr_text = await extract_text_from_bytes(file_bytes, file.content_type)
        is_valid_format, validation_message = validate_certificate_format(ocr_text)
        
        # Determine document type and confidence
        detected_type = None
        confidence = None
        
        if is_valid_format:
            text_lower = ocr_text.lower()
            certificate_keywords = ["certificate", "degree", "bachelor", "master", "phd", "diploma"]
            mark_sheet_keywords = ["mark sheet", "marksheet", "grade card", "transcript", "results"]
            
            if any(keyword in text_lower for keyword in certificate_keywords):
                detected_type = "certificate"
            elif any(keyword in text_lower for keyword in mark_sheet_keywords):
                detected_type = "mark_sheet"
            
            confidence = "high" if detected_type else "medium"
        
        return OCRValidationResponse(
            is_valid_format=is_valid_format,
            message=validation_message,
            detected_type=detected_type,
            confidence=confidence
        )
        
    except Exception as e:
        return OCRValidationResponse(
            is_valid_format=False,
            message=f"OCR processing failed: {str(e)}",
            detected_type=None,
            confidence=None
        )
