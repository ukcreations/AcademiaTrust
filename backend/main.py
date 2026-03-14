"""
AcademiaTrust Backend — FastAPI Application
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import hash_router, ocr_router, blockchain_router

app = FastAPI(
    title="AcademiaTrust API",
    description="Blockchain-Based Degree Authenticity Validator — Backend API",
    version="1.0.0",
)

# ─── CORS ────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ─────────────────────────────────────────────────────────────────
app.include_router(hash_router.router,       prefix="/api", tags=["Hash"])
app.include_router(ocr_router.router,        prefix="/api", tags=["OCR"])
app.include_router(blockchain_router.router, prefix="/api", tags=["Blockchain"])


@app.get("/", tags=["Health"])
async def root():
    return {
        "status": "ok",
        "message": "AcademiaTrust API is running 🎓",
        "docs":    "/docs",
    }
