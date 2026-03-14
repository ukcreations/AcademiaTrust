"""
routers/ocr_router.py — Tesseract OCR extraction endpoint
"""
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import Optional

from services.ocr_service import extract_text_from_bytes, parse_roll_number

router = APIRouter()


class OCRResponse(BaseModel):
    raw_text:    str
    roll_number: Optional[str]
    confidence:  str          # "high" | "medium" | "low"


@router.post("/ocr", response_model=OCRResponse, summary="Extract Roll Number from certificate via OCR")
async def ocr_certificate(file: UploadFile = File(...)):
    """
    Upload a PDF or image certificate.
    Uses Tesseract OCR to extract text and then regex-parses the Roll Number / Certificate ID.
    """
    allowed = {"application/pdf", "image/png", "image/jpeg", "image/jpg", "image/tiff", "image/bmp"}
    if file.content_type not in allowed:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {file.content_type}")

    file_bytes = await file.read()

    try:
        raw_text = await extract_text_from_bytes(file_bytes, file.content_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR failed: {str(e)}")

    roll_number, confidence = parse_roll_number(raw_text)

    return OCRResponse(
        raw_text=raw_text[:3000],  # Trim very long text in response
        roll_number=roll_number,
        confidence=confidence,
    )
