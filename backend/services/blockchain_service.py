"""
services/blockchain_service.py — web3.py integration with AcademiaTrust smart contract
"""
import json
import asyncio
import os
from datetime import datetime
from pathlib import Path
from typing import Optional, Tuple, Dict

from web3 import Web3
from web3.middleware import geth_poa_middleware
from config import get_settings

settings = get_settings()

# ─── ABI ─────────────────────────────────────────────────────────────────────
# Minimal ABI covering only the functions we call from the backend.
# Full ABI will be auto-populated once you compile the contract with Hardhat
# and copy artifacts/contracts/AcademiaTrust.sol/AcademiaTrust.json → backend/abi/

ABI_PATH = Path(__file__).parent.parent / "abi" / "AcademiaTrust.json"

_FALLBACK_ABI = [
    {
        "inputs": [
            {"internalType": "string", "name": "_rollNumber",    "type": "string"},
            {"internalType": "string", "name": "_fileHashHex",   "type": "string"},
            {"internalType": "string", "name": "_studentName",   "type": "string"},
            {"internalType": "string", "name": "_universityName","type": "string"},
            {"internalType": "string", "name": "_degree",        "type": "string"},
        ],
        "name": "issueCertificate",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    {
        "inputs": [
            {"internalType": "string", "name": "_rollNumber",  "type": "string"},
            {"internalType": "string", "name": "_fileHashHex", "type": "string"},
        ],
        "name": "verifyCertificate",
        "outputs": [{"internalType": "bool", "name": "verified", "type": "bool"}],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [{"internalType": "string", "name": "_rollNumber", "type": "string"}],
        "name": "getCertificateDetails",
        "outputs": [
            {"internalType": "string",  "name": "rollNumber",    "type": "string"},
            {"internalType": "string",  "name": "studentName",   "type": "string"},
            {"internalType": "string",  "name": "universityName","type": "string"},
            {"internalType": "string",  "name": "degree",        "type": "string"},
            {"internalType": "string",  "name": "fileHashHex",   "type": "string"},
            {"internalType": "uint256", "name": "issuedAt",      "type": "uint256"},
            {"internalType": "address", "name": "issuedBy",      "type": "address"},
        ],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [{"internalType": "string", "name": "_rollNumber", "type": "string"}],
        "name": "certificateExists",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function",
    },
]


def _load_abi() -> list:
    """Load ABI from compiled artifact, falling back to minimal hardcoded ABI."""
    if ABI_PATH.exists():
        with open(ABI_PATH, "r") as f:
            artifact = json.load(f)
            return artifact.get("abi", _FALLBACK_ABI)
    return _FALLBACK_ABI


def _get_web3() -> Web3:
    """Initialize Web3 connection to the configured RPC endpoint."""
    w3 = Web3(Web3.HTTPProvider(settings.rpc_url))
    # Required for POA chains (Sepolia, Goerli, local Hardhat)
    w3.middleware_onion.inject(geth_poa_middleware, layer=0)
    if not w3.is_connected():
        raise ConnectionError(f"Cannot connect to RPC: {settings.rpc_url}")
    return w3


def _get_contract(w3: Web3):
    """Return a bound contract instance."""
    abi = _load_abi()
    return w3.eth.contract(
        address=Web3.to_checksum_address(settings.contract_address),
        abi=abi,
    )


def _build_and_send(w3: Web3, contract_fn) -> str:
    """
    Build a transaction, sign it with the admin private key, send it,
    and wait for the receipt. Returns the transaction hash as hex string.
    """
    account = w3.eth.account.from_key(f"0x{settings.private_key}")
    nonce   = w3.eth.get_transaction_count(account.address)

    tx = contract_fn.build_transaction({
        "from":     account.address,
        "nonce":    nonce,
        "gas":      500_000,
        "gasPrice": w3.eth.gas_price,
    })

    signed  = w3.eth.account.sign_transaction(tx, private_key=f"0x{settings.private_key}")
    tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)

    if receipt.status != 1:
        raise RuntimeError("Transaction reverted on-chain")

    return receipt.transactionHash.hex()


# ─── Public async API ─────────────────────────────────────────────────────────

async def issue_certificate_on_chain(
    roll_number:     str,
    file_hash:       str,
    student_name:    str,
    university_name: str,
    degree:          str,
) -> str:
    """Issue a certificate on the blockchain. Returns transaction hash."""
    loop = asyncio.get_event_loop()

    def _issue():
        w3       = _get_web3()
        contract = _get_contract(w3)
        fn = contract.functions.issueCertificate(
            roll_number, file_hash, student_name, university_name, degree
        )
        return _build_and_send(w3, fn)

    return await loop.run_in_executor(None, _issue)


async def verify_certificate_on_chain(
    roll_number: str,
    file_hash:   str,
) -> Tuple[bool, Optional[Dict]]:
    """
    Verify a certificate hash on-chain.
    Returns (verified: bool, details: dict | None).
    """
    loop = asyncio.get_event_loop()

    def _verify():
        w3       = _get_web3()
        contract = _get_contract(w3)
        verified = contract.functions.verifyCertificate(roll_number, file_hash).call()

        if verified:
            result = contract.functions.getCertificateDetails(roll_number).call()
            details = {
                "roll_number":     result[0],
                "student_name":    result[1],
                "university_name": result[2],
                "degree":          result[3],
                "file_hash":       result[4],
                "issued_at":       datetime.utcfromtimestamp(result[5]).strftime("%Y-%m-%d %H:%M UTC"),
                "issued_by":       result[6],
            }
            return True, details
        return False, None

    return await loop.run_in_executor(None, _verify)


async def get_certificate_details(roll_number: str) -> Optional[Dict]:
    """Lookup certificate metadata by roll number."""
    loop = asyncio.get_event_loop()

    def _lookup():
        w3       = _get_web3()
        contract = _get_contract(w3)
        exists   = contract.functions.certificateExists(roll_number).call()
        if not exists:
            return None
        result = contract.functions.getCertificateDetails(roll_number).call()
        return {
            "roll_number":     result[0],
            "student_name":    result[1],
            "university_name": result[2],
            "degree":          result[3],
            "file_hash":       result[4],
            "issued_at":       datetime.utcfromtimestamp(result[5]).strftime("%Y-%m-%d %H:%M UTC"),
            "issued_by":       result[6],
        }

    return await loop.run_in_executor(None, _lookup)
