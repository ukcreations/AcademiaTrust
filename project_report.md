# AcademiaTrust: Comprehensive Project Report

## 1. Project Overview
**What is it?**  
AcademiaTrust is a **Blockchain-Based Degree Authenticity Validator**. It is a full-stack Web3 application designed to create an immutable, publicly verifiable registry of academic certificates leveraging Ethereum smart contracts.

**What does it do?**  
It allows educational institutions (Universities) to issue digital certificates that are mathematically tied to a specific student and securely stored on a blockchain. Recruiters and students can later upload a certificate file to cryptographically verify its authenticity, ensuring that the document has not been forged or tampered with.

---

## 2. The Need (Problem Statement)
**The Problem:** Academic fraud and fake degrees are significant issues globally (particularly highlighted in the project as stopping fake degrees in India). Traditional paper certificates are easy to forge, and verifying them manually with universities is slow, costly, and inefficient. Digital PDFs can also be easily edited using basic software.

**The Solution:** A decentralized, trustless system that provides immediate verification without relying on a centralized database that could be hacked or altered. 

---

## 3. Unique Selling Proposition (USP)
AcademiaTrust combines three distinct technologies to establish absolute trust:
1. **Document Fingerprinting (SHA-256):** Instead of storing the massive PDF on the blockchain, the system calculates a unique SHA-256 hash of the certificate file. Even changing a single pixel in the document will completely change this hash.
2. **Optical Character Recognition (OCR):** Tesseract OCR is used to intelligently read the uploaded certificate and automatically extract the student's Roll Number, tying the document directly to the student's identity.
3. **Immutable Ledger (Ethereum):** The combination of the document's hash and the extracted Roll Number is minted onto an Ethereum Smart Contract (functioning like a Soulbound Token/Credential). Once minted, it can never be altered or deleted.

---

## 4. How It Works (Workflow & Architecture)

**The Minting Workflow (Admin):**
1. University Admin uploads a student's PDF certificate.
2. The backend generates a SHA-256 hash of the exact file.
3. The transaction is minted onto the Smart Contract, recording the hash on the blockchain.
4. A transaction hash is returned as proof of issuance.

**The Verification Workflow (Recruiter):**
1. Recruiter uploads the provided PDF certificate.
2. The backend generates the SHA-256 hash of the uploaded file.
3. The backend uses OCR to extract the student's Roll Number from the document.
4. The backend queries the Smart Contract using the Roll Number. 
5. If the extracted hash from the blockchain exactly matches the hash of the uploaded document, the system returns ✅ **Verified**. Otherwise, it returns ❌ **Fake/Tampered**.

**The Architecture:**

```text
┌─────────────────────────────────────────────────────────┐
│                    AcademiaTrust                         │
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

* **Frontend:** React + Vite (Interacts with users and communicates via endpoints and Ethers.js).
* **Backend:** Python FastAPI (Handles intensive tasks like OCR via Tesseract, PDF hashing, and routing requests to the blockchain via web3.py).
* **Smart Contracts:** Solidity (Deployed via Hardhat to a Local Node or Sepolia testnet to store hashes).

---

## 5. Core Features & Portals
The platform is divided into three main user interfaces:

* **Admin Portal (`/admin`):** 
  * Features: Upload PDF certificates, initiate the minting process, and issue a credential to the blockchain.
  * User: University Staff / Administrators.
* **Verifier Portal (`/verify`):** 
  * Features: Upload a candidate's certificate to check against the blockchain registry. Returns instant true/false verification based on cryptographic matching.
  * User: HR Professionals, Recruiters, Background Verification Agencies.
* **Student View (`/student`):** 
  * Features: Enter a Roll Number to query the Smart Contract and view a digital "Soulbound Credential Card" representing their academic achievement.
  * User: Students/Alumni.

---

## 6. Technology Stack
**Smart Contracts (Web3):**
* **Language:** Solidity
* **Framework:** Hardhat
* **Integration Library:** web3.py (Backend), Ethers.js (Frontend)

**Backend:**
* **Framework:** Python FastAPI + Uvicorn
* **OCR Engine:** Tesseract (via `pytesseract`) + Poppler (for `pdf2image` conversion)
* **Configuration:** `pydantic-settings` (for handling `.env` variables)

**Frontend:**
* **Framework:** React.js powered by Vite
* **API Communication:** Axios

---

## 7. Everything Needed While Building & Running

### System Prerequisites (Crucial Manual Steps)
To build and run the complete project locally, the following system-level dependencies **must** be installed:
1. **Node.js 18+** (for Frontend and Hardhat).
2. **Python 3.10+** (for FastAPI Backend).
3. **Tesseract OCR Engine:** Required for reading the PDFs. (Path must be added to system environment variables).
4. **Poppler-utils:** Required by Python to convert PDFs into images for the OCR engine to read. (Path must be added to system environment variables).

### Development Flow (Order of Operations)
When setting up or developing the project, use this exact sequence:

1. **Start the Blockchain:** Navigate to `/contracts`, install dependencies, and run `npx hardhat node` to spin up a local blockchain.
2. **Deploy the Contract:** In a new terminal in `/contracts`, run a deployment script (e.g., `npm run deploy:local`) to deploy the `AcademiaTrust` contract to your local node.
3. **Configure the Backend:** 
   * Copy the deployed `CONTRACT_ADDRESS` and local private key to `/backend/.env`.
   * **Crucial Step:** Copy the compiled contract ABI from `contracts/artifacts/contracts/AcademiaTrust.sol/AcademiaTrust.json` into the `backend/abi/` folder so the Python API knows how to interact with the contract.
4. **Run the Backend:** Set up the Python virtual environment, install `requirements.txt`, and start the Uvicorn server (`uvicorn main:app --reload`).
5. **Run the Frontend:** Navigate to `/frontend`, install npm modules, configure the `.env` with the `VITE_CONTRACT_ADDRESS`, and run `npm run dev`.
