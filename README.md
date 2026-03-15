# TrueDegree 🎓🔗
### Blockchain-Based Degree Authenticity Validator

> Stop fake degrees in India — one hash at a time.

TrueDegree combines **OCR + SHA-256 hashing + Ethereum smart contracts** to create an immutable, publicly verifiable registry of academic certificates.

**Status**: ✅ Fully operational with all services running

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    TrueDegree                            │
├──────────────┬──────────────────┬───────────────────────┤
│  /contracts  │    /backend      │      /frontend         │
│  Solidity    │  Python FastAPI  │    React + Vite        │
│  Hardhat     │  Tesseract OCR   │    Ethers.js           │
│              │  web3.py         │    3 Portals           │
└──────────────┴──────────────────┴───────────────────────┘
                        │
              ┌─────────▼─────────┐
              │  Ethereum Network  │
              │  (Local / Sepolia)  │
              └───────────────────┘
```

## Three Portals

| Portal | Role | URL |
|--------|------|-----|
| **Admin Portal** | University uploads + mints certificate | `/admin` |
| **Verifier Portal** | Recruiter verifies applicant's certificate | `/verify` |
| **Student View** | Student sees their Soulbound credential | `/student` |

---

## Quick Start

### Prerequisites (Manual Steps ⚠️)

1. **Node.js 18+** — `node --version`
2. **Python 3.10+** — `python --version`
3. **Tesseract OCR** — [Windows installer](https://github.com/UB-Mannheim/tesseract/wiki) | Linux: `sudo apt install tesseract-ocr`
4. **Poppler** — [Windows](https://github.com/oschwartz10612/poppler-windows/releases) | Linux: `sudo apt install poppler-utils`

---

### Step 1 — Smart Contracts

```bash
cd contracts
npm install
npx hardhat node            # Start local blockchain node (keep this terminal open)
```

Open a new terminal:
```bash
cd contracts
npm run deploy:local        # Deploys contract, prints CONTRACT_ADDRESS
```

> **📋 Copy the printed `CONTRACT_ADDRESS` to `backend/.env`**

---

### Step 2 — Copy Contract ABI to Backend

```bash
# After compilation (done automatically by deploy), copy the ABI:
copy contracts\artifacts\contracts\AcademiaTrust.sol\AcademiaTrust.json backend\abi\AcademiaTrust.json
```

---

### Step 3 — Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env      # Edit with CONTRACT_ADDRESS and PRIVATE_KEY
uvicorn main:app --reload --port 8000
```

> Interactive API docs: **http://localhost:8000/docs**

---

### Step 4 — Frontend

```bash
cd frontend
npm install
cp .env.example .env        # Edit VITE_CONTRACT_ADDRESS
npm run dev
```

> Open: **http://localhost:5173**

---

## How It Works

```
University Admin:
  Upload PDF → SHA-256 Hash → Mint on Smart Contract → Tx Hash ✅

Recruiter:
  Upload PDF → SHA-256 + OCR → Query Smart Contract → ✅ Verified / ❌ Fake

Student:
  Enter Roll No → Query Smart Contract → Soulbound Credential Card 🎓
```

---

## Project Structure

```
web3/
├── contracts/
│   ├── AcademiaTrust.sol       ← Solidity smart contract
│   ├── scripts/deploy.js       ← Hardhat deploy script
│   ├── hardhat.config.js
│   └── package.json
├── backend/
│   ├── main.py                 ← FastAPI app
│   ├── config.py               ← Environment config
│   ├── abi/                    ← Contract ABI (copy after compile)
│   ├── routers/
│   │   ├── hash_router.py      ← POST /api/hash
│   │   ├── ocr_router.py       ← POST /api/ocr
│   │   └── blockchain_router.py← POST /api/issue, /api/verify, GET /api/certificate
│   └── services/
│       ├── ocr_service.py      ← Tesseract + regex extraction
│       └── blockchain_service.py ← web3.py contract calls
└── frontend/
    └── src/
        ├── pages/
        │   ├── Home.jsx
        │   ├── AdminPortal.jsx
        │   ├── VerifierPortal.jsx
        │   └── StudentView.jsx
        └── services/api.js     ← Axios API client
```
