// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title AcademiaTrust — Soulbound Degree Authenticity Registry
/// @notice Stores and verifies SHA-256 hashes of academic certificates on-chain.
///         Certificates are Soulbound: once issued, they cannot be transferred or deleted.
contract AcademiaTrust {
    // ─────────────────────────────────────────────────────────────────────────
    // Data Structures
    // ─────────────────────────────────────────────────────────────────────────

    struct Certificate {
        bytes32  fileHash;       // SHA-256 of the certificate file
        string   rollNumber;     // Unique student roll / reg number
        string   studentName;
        string   universityName;
        string   degree;
        uint256  issuedAt;       // Unix timestamp
        address  issuedBy;       // Admin wallet that minted
        bool     exists;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // State
    // ─────────────────────────────────────────────────────────────────────────

    address public owner;

    /// rollNumber ──► Certificate
    mapping(string => Certificate) private certificates;

    /// Authorized university admins (issuers)
    mapping(address => bool) public authorizedIssuers;

    // ─────────────────────────────────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────────────────────────────────

    event CertificateIssued(
        string  indexed rollNumber,
        bytes32         fileHash,
        string          studentName,
        string          universityName,
        address indexed issuedBy,
        uint256         issuedAt
    );

    event IssuerAdded(address indexed issuer);
    event IssuerRemoved(address indexed issuer);

    // ─────────────────────────────────────────────────────────────────────────
    // Modifiers
    // ─────────────────────────────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "AcademiaTrust: caller is not owner");
        _;
    }

    modifier onlyIssuer() {
        require(
            authorizedIssuers[msg.sender] || msg.sender == owner,
            "AcademiaTrust: caller is not an authorized issuer"
        );
        _;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────────────────────

    constructor() {
        owner = msg.sender;
        authorizedIssuers[msg.sender] = true;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Admin — Issuer Management
    // ─────────────────────────────────────────────────────────────────────────

    function addIssuer(address _issuer) external onlyOwner {
        authorizedIssuers[_issuer] = true;
        emit IssuerAdded(_issuer);
    }

    function removeIssuer(address _issuer) external onlyOwner {
        authorizedIssuers[_issuer] = false;
        emit IssuerRemoved(_issuer);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Core — Issue Certificate (Mint)
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice  Issue (mint) a certificate record on-chain. Soulbound — cannot be re-issued.
    /// @param   _rollNumber     Unique roll / registration number of the student
    /// @param   _fileHashHex    SHA-256 hash of the certificate file as a 64-char hex string
    /// @param   _studentName    Full name of the student
    /// @param   _universityName Issuing university name
    /// @param   _degree         Degree title (e.g., "B.Tech Computer Science")
    function issueCertificate(
        string  memory _rollNumber,
        string  memory _fileHashHex,
        string  memory _studentName,
        string  memory _universityName,
        string  memory _degree
    ) external onlyIssuer {
        require(bytes(_rollNumber).length > 0,     "Roll number required");
        require(bytes(_fileHashHex).length == 64,  "Invalid SHA-256 hash (must be 64 hex chars)");
        require(!certificates[_rollNumber].exists, "Certificate already issued for this roll number");

        bytes32 hash = _hexToBytes32(_fileHashHex);

        certificates[_rollNumber] = Certificate({
            fileHash:      hash,
            rollNumber:    _rollNumber,
            studentName:   _studentName,
            universityName: _universityName,
            degree:        _degree,
            issuedAt:      block.timestamp,
            issuedBy:      msg.sender,
            exists:        true
        });

        emit CertificateIssued(
            _rollNumber,
            hash,
            _studentName,
            _universityName,
            msg.sender,
            block.timestamp
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Core — Verify Certificate
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice  Verify that a given file hash matches the on-chain record for a roll number.
    /// @return  verified  true if both rollNumber exists AND the hash matches
    function verifyCertificate(
        string memory _rollNumber,
        string memory _fileHashHex
    ) external view returns (bool verified) {
        if (!certificates[_rollNumber].exists) return false;
        bytes32 submitted = _hexToBytes32(_fileHashHex);
        return certificates[_rollNumber].fileHash == submitted;
    }

    /// @notice  Returns full certificate metadata. Reverts if not found.
    function getCertificateDetails(string memory _rollNumber)
        external
        view
        returns (
            string  memory rollNumber,
            string  memory studentName,
            string  memory universityName,
            string  memory degree,
            string  memory fileHashHex,
            uint256        issuedAt,
            address        issuedBy
        )
    {
        Certificate storage c = certificates[_rollNumber];
        require(c.exists, "Certificate not found");
        return (
            c.rollNumber,
            c.studentName,
            c.universityName,
            c.degree,
            _bytes32ToHex(c.fileHash),
            c.issuedAt,
            c.issuedBy
        );
    }

    /// @notice  Check if a certificate exists for a roll number (without hash check).
    function certificateExists(string memory _rollNumber) external view returns (bool) {
        return certificates[_rollNumber].exists;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Internal Helpers
    // ─────────────────────────────────────────────────────────────────────────

    function _hexToBytes32(string memory hexStr) internal pure returns (bytes32 result) {
        bytes memory b = bytes(hexStr);
        require(b.length == 64, "Expected 64-char hex string");
        for (uint256 i = 0; i < 64; i += 2) {
            result = (result << 8) | bytes32(uint256(_hexCharToUint8(b[i])) * 16 + _hexCharToUint8(b[i + 1]));
        }
    }

    function _hexCharToUint8(bytes1 c) internal pure returns (uint8) {
        if (c >= 0x30 && c <= 0x39) return uint8(c) - 0x30;       // 0-9
        if (c >= 0x61 && c <= 0x66) return uint8(c) - 0x61 + 10;  // a-f
        if (c >= 0x41 && c <= 0x46) return uint8(c) - 0x41 + 10;  // A-F
        revert("Invalid hex char");
    }

    function _bytes32ToHex(bytes32 data) internal pure returns (string memory) {
        bytes memory hexChars = "0123456789abcdef";
        bytes memory result = new bytes(64);
        for (uint256 i = 0; i < 32; i++) {
            result[i * 2]     = hexChars[uint8(data[i]) >> 4];
            result[i * 2 + 1] = hexChars[uint8(data[i]) & 0x0f];
        }
        return string(result);
    }
}
