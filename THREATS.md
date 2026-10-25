# TrustVault — Threat Model & Security Analysis (THREATS.md)

**System:** TrustVault Zero-Trust Document Sharing & Cryptographic Audit Ledger  
**Author:** Candidate (Lead Security / Full-Stack Engineer)  
**Standard:** STRIDE & Defense-in-Depth Analysis  
**Date:** October 2026  

---

## Executive Summary

TrustVault is engineered around three non-negotiable operational invariants:
1. **Zero-Trust Server Authorization:** A document is reachable only by a subject who holds an active, unexpired, unrevoked grant. The server decides every time.
2. **Cryptographic Tamper-Evident Audit Record:** Every read, download, grant, revocation, and refused attempt is committed to an immutable SHA-256 cryptographic hash chain. Silent database alterations break the chain and are flagged during verification.
3. **Zero-Millisecond Revocation:** Access revocation takes effect across all running sessions instantaneously; cached permissions and pre-issued ephemeral tokens are invalidated at the moment of revocation.

Below is our comprehensive enumeration of attack vectors, the mechanisms implemented to eliminate them, and the residual risks knowingly accepted.

---

## 1. Threats Analyzed & Closed

### Threat 01: Insecure Direct Object Reference (IDOR) & Endpoint Parameter Manipulation
- **Attack Vector:** An authenticated viewer (e.g., Charlie Lin) discovers an endpoint pattern (`GET /api/documents/:id` or `GET /api/documents/:id/download`) and substitutes the ID of an unassigned confidential file (e.g., `doc_exec_comp_2026` or sequential IDs like `doc_001`, `doc_002`).
- **Potential Impact:** Complete breach of corporate payroll, board minutes, or acquisition contracts.
- **Defensive Mechanism:**
  - Client-side visibility filtering is treated strictly as UI presentation; **the server authorizes every request independently**.
  - `checkDocumentAuthorization()` enforces that non-owners MUST possess an active, non-revoked grant record specifically matching `actor.id == grant.userId`.
  - Non-existent documents and unauthorized documents return standardized denials to prevent enumeration.
  - Every rejected attempt generates an immutable `ACCESS_DENIED` security audit event logging the actor's IP, ID, target document ID, and timestamp.
- **Verification:** Covered by automated unit test `INVARIANT 2` in `src/security/security.test.ts` and Interactive Penetration Scenario #1 & #2.

---

### Threat 02: Stale Token Replay & Lingering Revocation Gap
- **Attack Vector:** An employee or contractor is granted access, receives an access link or token, and is subsequently revoked. Traditional stateless JWT systems allow the user to continue accessing documents until token expiry (e.g., 15–60 minutes).
- **Potential Impact:** An ex-employee downloads intellectual property or customer data immediately after being terminated.
- **Defensive Mechanism:**
  - **Zero-Trust Server Verification on Every Byte:** We do not rely on unrevocable stateless tokens for document payload access.
  - Ephemeral tokens (`ephem_*`) maintain a server-side active grant reference. When an owner clicks **Revoke Access**, the server marks `grant.revokedAt = ISO_TIMESTAMP` and immediately invalidates all active ephemeral tokens associated with that `(documentId, userId)` tuple.
  - On every read or download request, the server executes `checkDocumentAuthorization()`. If `revokedAt` is populated, the request is terminated with `403 Forbidden` with **0ms propagation delay**.
- **Verification:** Covered by unit test `INVARIANT 4` in `src/security/security.test.ts` and Interactive Penetration Scenario #3.

---

### Threat 03: Stealth Audit Trail Manipulation & History Erasure
- **Attack Vector:** A rogue privileged insider (or compromised database administrator) accesses the database directly and deletes or modifies audit rows to cover their tracks (e.g., deleting an unauthorized download record).
- **Potential Impact:** The organization cannot answer regulators or customers with integrity; forensic evidence is disqualified.
- **Defensive Mechanism:**
  - **Cryptographic SHA-256 Hash Chaining:** Every audit entry $B_i$ contains a canonical payload hash linked to the prior block's hash:
    $$H_i = \text{SHA256}(\text{Index}_i \parallel \text{Timestamp}_i \parallel \text{Action}_i \parallel \text{ActorId}_i \parallel \text{DocId}_i \parallel \text{Status}_i \parallel \text{Details}_i \parallel H_{i-1})$$
  - The genesis block links to a constant 64-zero root key (`0000...0000`).
  - Any alteration of historical fields, dropped records, or reordered entries alters the resulting hash, causing `verifyChain()` to immediately fail, pinpointing the exact tampered index.
  - Administrators can run `verifyAuditTrailIntegrity()` on demand or export a cryptographically verified JSON audit ledger.
- **Verification:** Covered by unit test `INVARIANT 6` in `src/security/security.test.ts` and the interactive "Tamper Simulation" console.

---

### Threat 04: Rogue Administrator / Insider Threat & Separation of Duties
- **Attack Vector:** A system administrator with platform management rights attempts to snoop into private employee salary discussions, board M&A files, or whistleblowing documents.
- **Potential Impact:** Breaches of confidentiality and executive privilege.
- **Defensive Mechanism:**
  - **Separation of Duties (Zero-Trust Administrator Policy):** Administrators possess system-level governance and forensic audit oversight (`checkAuditLogAccess`), but **CANNOT view or download confidential document payloads** unless the Document Owner has explicitly issued them a named permission grant (`checkDocumentAuthorization`).
  - Attempted payload snooping by an administrator results in an immediate `403 Forbidden` and is permanently committed to the audit ledger as an `ACCESS_DENIED` event.
- **Verification:** Covered by unit test `INVARIANT 5` in `src/security/security.test.ts` and Interactive Penetration Scenario #4.

---

### Threat 05: Malicious File Uploads (Executables, Scripts, Stored XSS & Polyglots)
- **Attack Vector:** An attacker uploads a malicious binary (`trojan.exe`, `script.sh`, `exploit.svg`, or a double-extension `invoice.pdf.exe`) to execute server-side code or trigger client-side Stored XSS when opened by a victim.
- **Potential Impact:** Remote code execution (RCE) on the host or session hijacking in the browser.
- **Defensive Mechanism:**
  - **Extension Whitelist & High-Risk Blacklist:** Extensions such as `.exe`, `.dll`, `.sh`, `.bat`, `.cmd`, `.vbs`, `.js`, `.py`, `.php`, and `.svg` are explicitly blocked.
  - **Content Payload Scanning:** The upload firewall inspects the initial payload byte stream for embedded script injection tokens (`<script`, `javascript:`, `onerror=`, `onload=`, `<?php`, `#!/bin/`).
  - **Strict Size Bounds:** Files larger than 25MB are rejected to prevent disk/memory exhaustion.
  - **Cryptographic Hashing on Ingestion:** A SHA-256 checksum is calculated upon ingestion to guarantee payload integrity against storage tampering.
- **Verification:** Covered by unit test `INVARIANT 7` in `src/security/security.test.ts` and Interactive Penetration Scenario #5.

---

### Threat 06: Directory Traversal & Arbitrary File Overwrite
- **Attack Vector:** An attacker specifies a malicious filename containing path escape sequences (e.g. `../../../../etc/passwd` or `..\\..\\system.ini`).
- **Potential Impact:** Arbitrary file read/overwrite on the host operating system.
- **Defensive Mechanism:**
  - Filenames are sanitized through regex isolation (`replace(/^.*[\\/]/, '')`), null-byte stripping (`\0`), and path-separator replacement (`[^a-zA-Z0-9._-]`).
  - Documents are stored by unique system-generated UUID identifiers (`doc_...`), decoupling client-supplied filenames from disk storage locations.
- **Verification:** Covered by unit test `INVARIANT 7` in `src/security/security.test.ts` and Interactive Penetration Scenario #6.

---

### Threat 07: Horizontal Privilege Escalation in Permission Management
- **Attack Vector:** A user with read-only access crafts an HTTP `POST /api/documents/:id/permissions` or `DELETE /api/documents/:id/permissions/:userId` request to grant themselves `EDIT` rights or revoke other users.
- **Potential Impact:** Unauthorized privilege expansion and document tampering.
- **Defensive Mechanism:**
  - The `GRANT` and `REVOKE` permission levels are strictly reserved for the Document Owner (`document.ownerId === user.id`).
  - Any permission modification attempt by a non-owner is rejected with `403 Forbidden` and recorded as an unauthorized privilege escalation attempt in the audit chain.
- **Verification:** Covered in `src/services/vaultService.ts:grantPermission()` and `revokePermission()`.

---

## 2. Threats Knowingly Accepted & Architectural Rationale

An honest threat model documents what is left out and why:

### Accepted Threat A: The "Analog Hole" & Physical Screen Photography
- **Vulnerability:** An authorized viewer with legitimate read permissions can point a physical smartphone camera at their screen or use OS-level screen capture tools to exfiltrate displayed text.
- **Why We Accepted It:** Without invasive kernel-level DRM drivers (which are incompatible with web standards and destroy user privacy), no web software can physically stop a camera in front of an LCD monitor.
- **Our Mitigation (Forensic Deterrence):**
  - We implemented a **Dynamic Forensic Watermark Engine**.
  - Every document viewer session renders a non-removable repeating diagonal watermark containing the viewer's verified email, client IP address, and exact UTC timestamp (`CONFIDENTIAL · TRUSTVAULT · VIEWED BY charlie@auditors.org (198.51.100.24) · 2026-10-24T...`).
  - If a document is photographed and leaked to social media or competitors, the source of the leak is undeniably identified in the image.

### Accepted Threat B: Pre-Computation / ASIC Re-Mining of Truncated Chains
- **Vulnerability:** If an attacker gains full root database access AND deletes the last $N$ records, they could hypothetically append new records from that point forward if the genesis block and chain are not anchored to an external time-stamping authority (TSA) or public blockchain.
- **Why We Accepted It:** Running a public blockchain node or paying gas fees per audit event introduces unacceptable latency (seconds to minutes) and privacy issues for confidential enterprise operations.
- **Production Roadmap Recommendation:** Periodic anchoring (e.g. daily root hash publication to RFC 3161 compliant timestamping authority or cloud KMS digital signature).

### Accepted Threat C: Multi-Gigabyte File Streaming & In-Memory Checksum Bounds
- **Vulnerability:** Uploading 5GB+ files synchronously blocks event loops if hashed entirely in memory.
- **Why We Accepted It:** In this 7-day scope, corporate confidential memos, contracts, spreadsheets, and audit packages rarely exceed 25MB. We enforce a strict 25MB ceiling.
- **Production Roadmap Recommendation:** S3 multipart upload with streaming backpressure and presigned chunk URLs.

---

## 3. Summary of Test Coverage Matrix

| Threat ID | Threat Name | Automated Test Location | Live Attack Simulation |
| :--- | :--- | :--- | :--- |
| **T-01** | IDOR on Document Read & Download | `security.test.ts: INVARIANT 2` | Scenario #1 & #2 |
| **T-02** | Stale Token & Lingering Access Gap | `security.test.ts: INVARIANT 4` | Scenario #3 |
| **T-03** | Stealth Audit Trail Tampering | `security.test.ts: INVARIANT 6` | Tamper Simulation Console |
| **T-04** | Administrator Insider Snooping | `security.test.ts: INVARIANT 5` | Scenario #4 |
| **T-05** | Malicious Executable Upload | `security.test.ts: INVARIANT 7` | Scenario #5 |
| **T-06** | Path Traversal File Overwrite | `security.test.ts: INVARIANT 7` | Scenario #6 |
| **T-07** | Non-Owner Privilege Escalation | `security.test.ts: INVARIANT 1` | In-app Permission Modal |
