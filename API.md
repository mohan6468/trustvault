# TrustVault — REST API Specification (API.md)

All endpoints strictly enforce Role-Based and Attribute-Based Access Control (RBAC/ABAC). Every request is evaluated by the server security engine before returning data.

**Base URL:** `/api`  
**Authentication Header:** `X-Actor-Id: <user_id>` (or Bearer Token)

---

## Endpoint Matrix

| Method | Endpoint | Required Role / Permission | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/documents` | Any authenticated user | Returns documents visible to the caller (Viewers see only granted files). |
| `GET` | `/api/documents/:id` | Document Owner or Named Active Grant | Returns document metadata and access state. Returns `403` if unassigned. |
| `GET` | `/api/documents/:id/read` | Document Owner or Named Active Grant | Returns document payload with dynamic forensic watermark parameters. Logs `DOCUMENT_READ`. |
| `GET` | `/api/documents/:id/download` | Document Owner or Named Active Grant | Streams the decrypted document file. Returns `403` if unassigned/revoked. Logs `DOCUMENT_DOWNLOAD`. |
| `POST` | `/api/documents` | Owner or Administrator | Uploads a new document with MIME & magic-byte validation and SHA-256 integrity calculation. |
| `DELETE` | `/api/documents/:id` | Document Owner ONLY | Deletes document and logs `DOCUMENT_DELETE`. |
| `POST` | `/api/documents/:id/permissions` | Document Owner ONLY | Grants named `READ` or `EDIT` permission to a specific user. Logs `PERMISSION_GRANTED`. |
| `DELETE` | `/api/documents/:id/permissions/:userId`| Document Owner ONLY | **Instantly revokes access**. Immediately invalidates ephemeral tokens. Logs `PERMISSION_REVOKED`. |
| `POST` | `/api/documents/:id/ephemeral-link` | Document Owner or Active Grant | Issues a time-limited ephemeral access token (default 60s). Logs `ACCESS_TOKEN_GENERATED`. |
| `GET` | `/api/audit` | Administrator (System) or Owner (Own docs) | Returns the cryptographic tamper-evident audit ledger. |
| `POST` | `/api/audit/verify` | Public / Any user | Executes full cryptographic hash chain verification from Genesis block. |
| `POST` | `/api/test/penetration` | Public / Auditor / Recruiter | Runs automated simulated attack vectors to prove security invariants live. |

---

## Detailed Endpoint Documentation

### 1. `GET /api/documents`
- **Caller Allowed:** Authenticated users (`admin`, `owner`, `viewer`). Intruders receive empty collection.
- **Query Parameters:**
  - `search` (string): Text query matching title, filename, tags, or owner name.
  - `category` (string): Filters by document category.
  - `ownerId` (string): Filters by document owner.
- **Response `200 OK`:**
  ```json
  [
    {
      "id": "doc_soc2_audit_evidence",
      "title": "Q3 SOC-2 Type II Independent Audit Evidence Package",
      "filename": "soc2_type2_audit_evidence.pdf",
      "fileSize": 498210,
      "category": "Compliance & Audit",
      "classification": "CONFIDENTIAL",
      "ownerName": "Alice Vance",
      "createdAt": "2026-10-20T11:00:00Z"
    }
  ]
  ```

---

### 2. `GET /api/documents/:id/read`
- **Caller Allowed:** Document Owner OR Named Grantee with active `READ` or `EDIT` permission.
- **Security Invariant:** The server checks `grant.revokedAt` and `grant.expiresAt`.
- **Response `200 OK` (Authorized):**
  ```json
  {
    "status": 200,
    "content": "TRUSTVAULT SOC-2 TYPE II AUDIT EVIDENCE REPOSITORY...",
    "watermarkText": "CONFIDENTIAL · TRUSTVAULT · VIEWED BY charlie.lin@acme-auditors.org (198.51.100.24) · 2026-10-24T06:14:00Z",
    "document": { ... }
  }
  ```
- **Response `403 Forbidden` (Unauthorized / Refused):**
  ```json
  {
    "status": 403,
    "error": "Forbidden: No active grant for document payload."
  }
  ```
  *Side Effect:* Server appends an immutable `ACCESS_DENIED` block to the cryptographic audit chain.

---

### 3. `DELETE /api/documents/:id/permissions/:userId`
- **Caller Allowed:** Document Owner ONLY.
- **Behavior:**
  - Sets `revokedAt = ISO_TIMESTAMP`.
  - Immediately invalidates all ephemeral tokens tied to this user and document.
  - Any concurrent or subsequent request from this user fails with `403 Forbidden` within 0 milliseconds.
- **Response `200 OK`:**
  ```json
  {
    "status": 200,
    "success": true,
    "message": "Instant Revocation: Access nullified immediately."
  }
  ```

---

### 4. `POST /api/audit/verify`
- **Caller Allowed:** Any auditor, administrator, or test suite.
- **Behavior:** Mathematically re-hashes all blocks sequentially from index 0 to $N-1$, validating previous hash links and payload checksums.
- **Response `200 OK` (Chain Valid):**
  ```json
  {
    "valid": true,
    "verifiedBlocks": 12
  }
  ```
- **Response `200 OK` (Tampering Detected):**
  ```json
  {
    "valid": false,
    "verifiedBlocks": 2,
    "errorIndex": 3,
    "reason": "Tampering detected in block #3! Payload content has been modified.",
    "expectedHash": "4a7484aa...",
    "actualHash": "81c2c92e..."
  }
  ```
