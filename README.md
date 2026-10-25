# TrustVault — Secure Document Sharing with a Real Audit Trail

TrustVault is a zero-trust enterprise document platform where **the wrong person can never read the file, and you can prove exactly who reached it**.

---

## The Three Non-Negotiable Standards

1. **Reachable Only When Granted:** The server evaluates every read, download, edit, and delete request independently. Client-side visibility is never trusted. If a user is not granted access, they receive an immutable `403 Forbidden`.
2. **Cryptographically Tamper-Evident Audit Trail:** Every upload, view, download, permission grant, revocation, and refused attempt is linked in a SHA-256 cryptographic hash chain (similar to a blockchain block ledger). If any row is altered in the database, the hash verification fails instantly, pinpointing the exact modified block.
3. **Instant Access Revocation:** When an owner takes access away, it terminates immediately with **0 milliseconds of lingering exposure**. All pre-issued ephemeral tokens and active sessions stop working at that exact moment.

---

## Login Credentials & The 3 Role Interfaces

The application features a dedicated **Authentication Gateway** with credentials for each role and 1-click quick authenticators:

| Role | Name | Email | Password | Dedicated Interface |
| :--- | :--- | :--- | :--- | :--- |
| 🛡️ **Administrator** | Sarah Chen | `sarah.admin@trustvault.internal` | `AdminPassword2026!` | **Administrative Security & Governance Console**: Full cryptographic audit ledger, tamper detection, incident response, and governance. *(Separation of Duties: cannot view confidential payloads).* |
| 👤 **Document Owner** | Alice Vance | `alice.vance@trustvault.internal` | `OwnerPassword2026!` | **Document Publishing & Access Authority**: Upload confidential files, grant read/edit permissions to named people, and execute instant 0ms access revocations. |
| 🔍 **Viewer** | Charlie Lin | `charlie.lin@acme-auditors.org` | `ViewerPassword2026!` | **Secure Watermarked Reading Room**: Restricted repository displaying only granted compliance documents, with dynamic forensic watermarks traceable to their email, IP, and timestamp. |
| 😈 **Intruder** | Eve Malicious | `eve@shadow-threat.net` | `IntruderPassword2026!` | **Zero-Privilege Boundary Sandbox**: Proves that untrusted actors have zero access; all direct queries return HTTP 403 Forbidden. |

---

## Key Features

- **Dynamic Forensic Watermark Viewer:** Every authorized document view displays a real-time, non-removable diagonal watermark with the viewer's email, verified IP address, and timestamp (`CONFIDENTIAL · TRUSTVAULT · VIEWED BY charlie@auditors.org (198.51.100.24)`), neutralizing casual exfiltration.
- **Interactive Security Penetration Attack Simulator:** A built-in security lab tab where hiring managers can run real attack vectors (IDOR attack, expired token replay, instant revocation verification, rogue admin inspection, malicious executable upload, path traversal) and inspect the server's refusal response and cryptographic audit ledger.
- **Audit Tamper Simulator:** A dedicated demonstration tool in the Admin Console that simulates a stealth database modification and triggers the cryptographic chain integrity validator to prove detection.
- **Ephemeral Access Links:** Generate time-limited secure links (e.g. 60 seconds) with countdown and instant invalidation on revocation.
- **Upload Firewall:** Comprehensive file validation with extension whitelisting, script injection token scanning, path traversal sanitization, and SHA-256 checksum generation.

---

## Documentation

- **[THREATS.md](./THREATS.md):** Exhaustive STRIDE threat model covering closed vectors and documented accepted trade-offs.
- **[PROMPTS.md](./PROMPTS.md):** Dated prompt engineering log with critical critiques and corrections covering authorization and cryptographic audit design.
- **[API.md](./API.md):** Complete REST API specification with RBAC requirements per endpoint.

---

## Running Automated Security Tests

Run the security invariant test suite verifying zero-trust authorization, instant revocation, and hash chain integrity:

```bash
# Run unit tests via Node's native test runner
npx --yes tsx --test src/security/security.test.ts
```

All 7 security invariants pass deterministically in under 1 second.
