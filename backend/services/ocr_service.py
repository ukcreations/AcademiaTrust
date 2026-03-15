"""
services/ocr_service.py — Tesseract OCR integration
"""
import io
import re
import asyncio
from typing import Optional, Tuple

import pytesseract
from PIL import Image

from config import get_settings

settings = get_settings()

# Point pytesseract to the Tesseract executable
pytesseract.pytesseract.tesseract_cmd = settings.tesseract_cmd


def _image_to_text(image: Image.Image) -> str:
    """Run Tesseract OCR on a PIL Image and return extracted text."""
    # Use --psm 6 (assume uniform block of text) for best results on certificates
    custom_config = r"--oem 3 --psm 6"
    return pytesseract.image_to_string(image, config=custom_config)


def _pdf_bytes_to_text(pdf_bytes: bytes) -> str:
    """Convert PDF pages to images then OCR each page."""
    try:
        from pdf2image import convert_from_bytes
    except ImportError:
        raise RuntimeError("pdf2image is not installed. Run: pip install pdf2image")

    # NOTE: pdf2image requires poppler installed on the OS.
    #   Windows: download poppler from https://github.com/oschwartz10612/poppler-windows/releases
    #            and add its bin/ directory to PATH.
    #   Linux:   sudo apt-get install poppler-utils
    images = convert_from_bytes(pdf_bytes, dpi=300)
    texts = []
    for img in images:
        texts.append(_image_to_text(img))
    return "\n".join(texts)


async def extract_text_from_bytes(file_bytes: bytes, content_type: str) -> str:
    """
    Async wrapper around OCR extraction.
    Runs the blocking Tesseract call in a thread executor.
    """
    loop = asyncio.get_event_loop()

    if content_type == "application/pdf":
        text = await loop.run_in_executor(None, _pdf_bytes_to_text, file_bytes)
    else:
        image = Image.open(io.BytesIO(file_bytes)).convert("RGB")
        text = await loop.run_in_executor(None, _image_to_text, image)

    return text


def parse_roll_number(text: str) -> Tuple[Optional[str], str]:
    """
    Extract Roll Number / Certificate ID from OCR text using regex patterns.

    Returns:
        (roll_number, confidence) where confidence is "high" | "medium" | "low"

    Common Indian university certificate patterns:
        - Roll No: XXXXXXXX
        - Regd. No.: XXXX/XXXX
        - Certificate No: XXXXXXXXXXXX
        - Enrolment No: XXXXXXXXX
        - Student ID: XXXXXXXXXX
    """
    patterns = [
        # High confidence — explicit labels
        (r"(?:Roll\s*(?:No|Number|No\.)\s*[:\-]?\s*)([A-Z0-9]{4,20})", "high"),
        (r"(?:Registration\s*(?:No|Number|No\.)\s*[:\-]?\s*)([A-Z0-9\-\/]{4,20})", "high"),
        (r"(?:Regd\.?\s*(?:No|Number)\s*[:\-]?\s*)([A-Z0-9\-\/]{4,20})", "high"),
        (r"(?:Certificate\s*(?:ID|No|Number)\s*[:\-]?\s*)([A-Z0-9\-]{4,20})", "high"),
        (r"(?:Enrol(?:l?ment)?\s*(?:No|Number)\s*[:\-]?\s*)([A-Z0-9]{4,20})", "high"),
        (r"(?:Student\s*ID\s*[:\-]?\s*)([A-Z0-9]{4,20})", "high"),

        # Medium confidence — pattern-based
        (r"\b([A-Z]{2,4}[0-9]{5,12})\b", "medium"),   # e.g., BTH20200123, CSE2021456
        (r"\b([0-9]{2}[A-Z]{2,4}[0-9]{4,8})\b", "medium"),  # e.g., 20BCA00123

        # Low confidence — generic long numeric
        (r"\b([0-9]{8,15})\b", "low"),
    ]

    for pattern, confidence in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1).strip().upper(), confidence

    return None, "low"


def validate_certificate_format(text: str) -> Tuple[bool, str]:
    """
    Validate if the OCR text contains certificate/mark sheet keywords and format.
    
    Returns:
        (is_valid, message)
    """
    # Certificate and mark sheet keywords
    certificate_keywords = [
        "certificate", "degree", "bachelor", "master", "phd", "diploma",
        "engineering", "technology", "science", "arts", "commerce",
        "university", "college", "institute", "graduated", "completed",
        "academic", "qualification", "award", "conferred"
    ]
    
    mark_sheet_keywords = [
        "mark sheet", "marksheet", "statement of marks", "grade card",
        "transcript", "academic record", "examination", "results",
        "semester", "subject", "paper", "course", "credits", "gpa",
        "percentage", "division", "class", "distinction"
    ]
    
    text_lower = text.lower()
    
    # Check for certificate keywords
    has_certificate_content = any(keyword in text_lower for keyword in certificate_keywords)
    
    # Check for mark sheet keywords  
    has_marksheet_content = any(keyword in text_lower for keyword in mark_sheet_keywords)
    
    # Check for university/institution indicators
    has_university_indicators = any(word in text_lower for word in ["university", "college", "institute", "school"])
    
    # Check for name and roll number patterns
    has_name_pattern = bool(re.search(r"(?:name\s*[:\-]?\s*)([A-Z\s]{3,50})", text, re.IGNORECASE))
    has_roll_pattern = bool(re.search(r"(?:roll\s*(?:no|number|no\.)\s*[:\-]?\s*)([A-Z0-9]{4,20})", text, re.IGNORECASE))
    
    # Validate certificate format
    if has_certificate_content and has_university_indicators and has_name_pattern:
        return True, "Valid certificate format detected"
    
    # Validate mark sheet format
    if has_marksheet_content and has_university_indicators and (has_roll_pattern or has_name_pattern):
        return True, "Valid mark sheet format detected"
    
    # If neither format is detected
    if not has_certificate_content and not has_marksheet_content:
        return False, "Please upload a valid certificate or mark sheet"
    
    if not has_university_indicators:
        return False, "Document does not appear to be from an educational institution"
    
    if not has_name_pattern:
        return False, "Document does not contain student name information"
    
    return False, "Please upload a valid certificate or mark sheet"
