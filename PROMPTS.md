# TrustVault — AI Interaction & Engineering Log (PROMPTS.md)

This log records the prompts, AI outputs, critical engineering critiques, and corrections made during the development of TrustVault. At least two entries specifically focus on authorization, access control, and cryptographic audit invariants.

---

## Reusable Context Prompt Used Across the Week

```markdown
Role: Principal Security & Systems Architect.
Context: Building TrustVault, a zero-trust confidential document platform where:
1. The wrong person must NEVER read or download a file through any route.
2. The server authorizes every transaction; no client-side assumptions.
3. Access revocation must take effect immediately (0ms lingering window).
4. Every read, write, download, permission change, and refused attempt is committed to a tamper-evident SHA-256 hash chain.
5. Administrators cannot view confidential documents without explicit grants (Separation of Duties).
Standard: Code must be decoupled, deterministic, covered by automated unit tests, and accompanied by an adversarial threat model.
```

---

## Log Entry 1: Authorization & Instant Access Revocation

- **Date:** October 18, 2026
- **Prompt:**
  > "Design the authorization and permission model for TrustVault. We need roles (Admin, Owner, Viewer), document sharing, and fast revocation. Suggest an industry standard token architecture."
- **What the AI Produced:**
  The model proposed issuing signed JSON Web Tokens (JWTs) with a 15-minute expiration containing the user's role and granted document IDs:
  ```json
  { "sub": "usr_viewer_charlie", "role": "viewer", "docs": ["doc_soc2_audit"], "exp": 1729468800 }
  ```
  It recommended validating the signature at the API gateway without touching the database to maximize throughput.
- **What was Wrong with it, Specifically:**
  This violates the core requirement: *"Taking access away works immediately. Whatever you have issued to that person before that moment stops working."*  
  If Alice revokes Charlie's access at minute 1, Charlie's JWT remains valid for the next 14 minutes. During that entire window, Charlie can continue reading and downloading confidential files from any browser or curl script. A blacklist or Redis cache was suggested as an afterthought, but relying on stateless tokens for a zero-trust instant revocation requirement is architectural negligence.
- **What We Did Instead:**
  We completely discarded stateless JWT permission claims. In TrustVault:
  1. The server executes `checkDocumentAuthorization()` directly against active grant records on every single read or download request.
  2. Revocation immediately sets `grant.revokedAt = ISO_TIMESTAMP`.
  3. Ephemeral view tokens (`ephem_*`) are mapped to the active grant; invalidating the grant immediately terminates any active token.
  4. See implementation in `src/security/accessControl.ts` and unit test `INVARIANT 4` in `src/security/security.test.ts`.

---

## Log Entry 2: Cryptographic Audit Trail Architecture

- **Date:** October 19, 2026
- **Prompt:**
  > "Write a schema and logging function for our document audit trail. We need to track uploads, downloads, changes, deletions, and permission changes so we can prove who opened what to auditors."
- **What the AI Produced:**
  A standard PostgreSQL/Firestore schema with an auto-incrementing ID, timestamp, user ID, document ID, action string, and an `ip_address` column. It also added a helper `updateAuditLog()` function that allowed updating notes on existing audit entries.
- **What was Wrong with it, Specifically:**
  1. **Mutable Records:** Supplying an `update` or `edit` affordance on an audit table is unacceptable. The prompt explicitly warned: *"An audit trail that can be quietly altered is not evidence, and we will ask you what stops that."*
  2. **Zero Tamper Evidence:** A standard table offers zero defense against a database admin or attacker who runs `UPDATE audit_logs SET action = 'DOCUMENT_READ' WHERE id = 42` or simply `DELETE FROM audit_logs WHERE actor_id = 'rogue_user'`.
  3. **Missing Refusal Tracking:** It only logged successful events; failed access attempts (403s) were not logged at all.
- **What We Did Instead:**
  1. Built a **SHA-256 Cryptographic Hash Chain** (blockchain/git-like commit linkage) in `src/security/cryptoChain.ts`.
  2. Each block calculates:
     $$H_i = \text{SHA256}(\text{Index}_i \parallel \text{Timestamp}_i \parallel \text{Action}_i \parallel \text{Actor}_i \parallel \text{DocId}_i \parallel \text{Status}_i \parallel \text{Details}_i \parallel H_{i-1})$$
  3. Altering or deleting any historical record breaks the subsequent block's `previousHash`, which is immediately flagged by `verifyChain()`.
  4. Every failed or refused attempt is committed with `status: 'DENIED'`.

---

## Log Entry 3: Administrator Privilege Boundaries & Separation of Duties

- **Date:** October 20, 2026
- **Prompt:**
  > "Implement the RBAC authorization middleware for endpoints. We have Administrator, Document Owner, and Viewer roles."
- **What the AI Produced:**
  ```typescript
  function authorize(user, doc, action) {
    if (user.role === 'admin') return true; // Admins can do anything
    if (doc.ownerId === user.id) return true;
    return doc.permissions.some(p => p.userId === user.id);
  }
  ```
- **What was Wrong with it, Specifically:**
  The `if (user.role === 'admin') return true;` pattern is the classic "God-Mode Admin" anti-pattern. In confidential environments (HR salary data, whistleblower reports, M&A term sheets), system administrators must NOT have carte-blanche read access to payload contents. An IT administrator needs to manage users and inspect audit logs, but should never be able to snoop into confidential salary spreadsheets without authorization.
- **What We Did Instead:**
  Enforced strict **Separation of Duties (Zero-Trust Administrator Policy)** in `src/security/accessControl.ts`:
  - `checkAuditLogAccess(user)`: Admins CAN inspect system-wide audit trails and health metrics.
  - `checkDocumentAuthorization(user, doc, 'READ')`: Admins CANNOT read or download confidential file contents unless the Document Owner has explicitly issued them a named permission grant.
  - S Tested and verified in `security.test.ts: INVARIANT 5`.

---

## Log Entry 4: File Upload Validation & Stored Exploit Prevention

- **Date:** October 21, 2026
- **Prompt:**
  > "Create a file upload handler that validates uploaded documents before storing them in TrustVault."
- **What the AI Produced:**
  ```typescript
  if (!file.mimetype.startsWith('application/') && !file.mimetype.startsWith('image/')) {
    throw new Error('Invalid file type');
  }
  const filePath = path.join('/uploads', file.name);
  fs.writeFileSync(filePath, file.data);
  ```
- **What was Wrong with it, Specifically:**
  1. **MIME Spoofing Vulnerability:** Checking `file.mimetype.startsWith('application/')` accepts `application/x-msdos-program` (.exe), `application/x-sh` (.sh), and `application/javascript`!
  2. **Path Traversal Attack:** Writing directly to `path.join('/uploads', file.name)` allows an attacker to supply `../../../../etc/cron.d/evil` to overwrite critical system files.
  3. **Stored XSS via SVG:** Accepting generic image MIME types accepts `.svg` files containing inline `<script>` tags that execute in the viewer's browser context.
- **What We Did Instead:**
  Implemented a hardened upload firewall in `src/security/uploadValidator.ts`:
  1. Explicit whitelist of business document formats (`.pdf`, `.docx`, `.xlsx`, `.csv`, `.txt`, `.json`, `.png`, `.jpg`).
  2. Explicit blacklist blocking `.exe`, `.sh`, `.bat`, `.svg`, `.php`, `.js`, etc.
  3. Path traversal stripping: removes directory traversal tokens and regex-sanitizes base filenames.
  4. Content scanning: scans the initial byte stream for script tags and executable headers.
  5. Tested and verified in `security.test.ts: INVARIANT 7`.

---

## Log Entry 5: Information Leakage via Search & Directory Enumeration

- **Date:** October 22, 2026
- **Prompt:**
  > "Add search and filtering for documents by name, category, owner, and date. Show matching documents in the UI."
- **What the AI Produced:**
  The AI wrote a query that returned all matching documents from the entire database, and then suggested hiding unauthorized results in React:
  ```tsx
  {documents.filter(d => userHasAccess(user, d)).map(...)}
  ```
- **What was Wrong with it, Specifically:**
  This exposes all metadata in the network response. An attacker opening the Network tab would see confidential document titles, owners, categories, and hashes for documents they have no right to know exist.
- **What We Did Instead:**
  1. Moved filtering strictly to the server boundary (`vaultService.getDocuments(user)`).
  2. Viewers receive ONLY documents they own or have an active, non-revoked grant for.
  3. Untrusted actors (`role: 'intruder'`) receive an empty array with zero metadata leakage.
