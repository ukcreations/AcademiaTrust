"""
routers/hash_router.py — SHA-256 file hashing endpoint
"""
import hashlib
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel

router = APIRouter()


class HashResponse(BaseModel):
    filename: str
    sha256:   str
    size_kb:  float


@router.post("/hash", response_model=HashResponse, summary="Compute SHA-256 hash of uploaded file")
async def compute_hash(file: UploadFile = File(...)):
    """
    Upload a PDF or image file.
    Returns the SHA-256 hex digest — this is the 'fingerprint' stored on-chain.
    """
    if file.content_type not in (
        "application/pdf",
        "image/png", "image/jpeg", "image/jpg",
        "image/tiff", "image/bmp",
    ):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type}. Use PDF or image."
        )

    contents = await file.read()
    sha256_hash = hashlib.sha256(contents).hexdigest()

    return HashResponse(
        filename=file.filename,
        sha256=sha256_hash,
        size_kb=round(len(contents) / 1024, 2),
    )
