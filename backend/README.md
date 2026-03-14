# AcademiaTrust — Backend API

A Python FastAPI backend for the AcademiaTrust degree authenticity platform.

---

## Tech Stack

| Component | Library |
|-----------|---------|
| Web Framework | FastAPI + Uvicorn |
| OCR | Tesseract (pytesseract) + pdf2image |
| Blockchain | web3.py (v6) |
| Config | pydantic-settings (.env) |

---

## Prerequisites — Manual Steps Required ⚠️

> These must be installed **manually** before running the backend.

### 1. Python 3.10+
Make sure Python is installed: `python --version`

### 2. Tesseract OCR Engine
**Windows:**
- Download installer: https://github.com/UB-Mannheim/tesseract/wiki
- Install to the default path: `C:\Program Files\Tesseract-OCR\`
- Add `C:\Program Files\Tesseract-OCR\` to your system **PATH** environment variable

**Linux:**
```bash
sudo apt-get install tesseract-ocr
```

### 3. Poppler (for PDF → image conversion)
**Windows:**
- Download: https://github.com/oschwartz10612/poppler-windows/releases
- Extract and add `poppler/Library/bin` to your system **PATH**

**Linux:**
```bash
sudo apt-get install poppler-utils
```

---

## Setup

```bash
# 1. Navigate to backend folder
cd backend

# 2. Create virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Linux/Mac

# 3. Install dependencies
pip install -r requirements.txt

# 4. Set up environment variables
copy .env.example .env         # Windows
# cp .env.example .env         # Linux/Mac
# → Edit .env with your values (contract address, private key, RPC URL)

# 5. Copy ABI after compiling the contract
# See: abi/README.json for instructions

# 6. Start the server
uvicorn main:app --reload --port 8000
```

Open **http://localhost:8000/docs** to explore the interactive Swagger UI.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/` | Health check |
| POST | `/api/hash` | Compute SHA-256 of uploaded file |
| POST | `/api/ocr`  | Extract Roll Number via Tesseract |
| POST | `/api/issue` | Mint certificate on blockchain |
| POST | `/api/verify` | Verify certificate file against blockchain |
| GET  | `/api/certificate/{roll_number}` | Lookup certificate by roll number |

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `RPC_URL` | Ethereum node RPC (default: `http://127.0.0.1:8545`) |
| `CONTRACT_ADDRESS` | Deployed AcademiaTrust contract address |
| `PRIVATE_KEY` | Admin wallet private key (no 0x prefix) |
| `ADMIN_ADDRESS` | Admin wallet address |
| `TESSERACT_CMD` | Path to Tesseract executable |
