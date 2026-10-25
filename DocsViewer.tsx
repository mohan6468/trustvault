/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FileText, ShieldAlert, BookOpen, Code2, Copy, Check } from 'lucide-react';

export const DocsViewer: React.FC = () => {
  const [activeDoc, setActiveDoc] = useState<'threats' | 'prompts' | 'api' | 'readme'>('threats');
  const [copied, setCopied] = useState(false);

  const getDocTitle = () => {
    switch (activeDoc) {
      case 'threats': return 'THREATS.md — STRIDE Security Analysis & Accepted Trade-offs';
      case 'prompts': return 'PROMPTS.md — AI Engineering Log & Authorization Fixes';
      case 'api': return 'API.md — REST API & Access Control Specification';
      case 'readme': return 'README.md — Architecture, Test Personas & Invariants';
    }
  };

  const getDocContent = () => {
    switch (activeDoc) {
      case 'threats':
        return `# TrustVault — Threat Model & Security Analysis (THREATS.md)

1. THREATS ANALYZED & CLOSED:
- T-01: Insecure Direct Object Reference (IDOR) & Endpoint Parameter Manipulation
  Defense: The server executes checkDocumentAuthorization() independently on every read/download/delete request. Client-side visibility is never trusted. Every refused attempt logs an ACCESS_DENIED audit block.
  Automated Test: security.test.ts: INVARIANT 2 & Attack Scenario #1.

- T-02: Stale Token Replay & Lingering Revocation Gap
  Defense: Zero stateless JWT claims. When access is revoked, revokedAt is set and all ephemeral tokens for that user/document tuple are immediately invalidated. Next request fails with 403 in 0ms.
  Automated Test: security.test.ts: INVARIANT 4 & Attack Scenario #3.

- T-03: Stealth Audit Trail Manipulation & History Erasure
  Defense: SHA-256 Cryptographic Hash Chaining. Each block hashes its canonical payload and links to previous block's hash. Any modification breaks the chain and is caught by verifyChain().
  Automated Test: security.test.ts: INVARIANT 6 & Admin Tamper Simulation.

- T-04: Rogue Administrator Privilege Escalation / Insider Threat
  Defense: Separation of Duties (Zero-Trust Administrator Policy). Administrators have audit oversight, but CANNOT read private document payloads without an explicit grant from the Document Owner.
  Automated Test: security.test.ts: INVARIANT 5 & Attack Scenario #4.

- T-05: Malicious File Uploads (Executables, Scripts, Polyglots)
  Defense: Whitelist of corporate extensions (.pdf, .docx, .xlsx, .csv, .txt, .json), blacklist (.exe, .sh, .bat, .svg, .js), byte-stream script token inspection, and size caps.
  Automated Test: security.test.ts: INVARIANT 7 & Attack Scenario #5.

- T-06: Directory Traversal & Arbitrary File Overwrite
  Defense: Path escape characters (../) stripped, base filename isolated via regex, UUID storage decoupling.
  Automated Test: security.test.ts: INVARIANT 7 & Attack Scenario #6.

2. THREATS KNOWINGLY ACCEPTED & RATIONALE:
- Accepted Threat A: Analog Hole & Physical Screen Photography
  Why Accepted: Without invasive OS kernel DRM, no web app can block external cameras.
  Mitigation: Dynamic Forensic Watermark Engine (renders viewer email, IP, and UTC timestamp across all views).

- Accepted Threat B: Pre-Computation / ASIC Re-Mining of Truncated Chains
  Why Accepted: Public blockchain gas fees introduce latency. We recommend periodic external RFC 3161 timestamping.

- Accepted Threat C: Multi-Gigabyte In-Memory Hashing
  Why Accepted: 25MB ceiling enforced in 7-day scope; streaming multipart hashing scheduled for production.`;

      case 'prompts':
        return `# TrustVault — AI Interaction & Engineering Log (PROMPTS.md)

1. REUSABLE CONTEXT PROMPT:
Role: Principal Security & Systems Architect.
Context: Building TrustVault zero-trust confidential document platform.
Standard: Code must be decoupled, deterministic, covered by automated unit tests.

2. LOG ENTRY 1 (Oct 18, 2026) — AUTHORIZATION & INSTANT REVOCATION:
- Asked: "Design authorization and token model for TrustVault with fast revocation."
- AI Produced: 15-minute stateless JWTs with document claims.
- What Was Wrong: Completely broke instant revocation! A revoked user could still download files for 14 minutes.
- What We Did Instead: Discarded stateless JWTs for document access. Evaluated active grants directly on server on every request.

3. LOG ENTRY 2 (Oct 19, 2026) — CRYPTOGRAPHIC AUDIT TRAIL:
- Asked: "Write schema and logging function for our document audit trail."
- AI Produced: Standard SQL table with an updateAuditLog() function.
- What Was Wrong: Mutable audit logs and zero defense against a DBA running UPDATE/DELETE. Did not record 403 refused attempts!
- What We Did Instead: Built SHA-256 Cryptographic Hash Chain. Each block links to previous block's hash. Refusals recorded as ACCESS_DENIED.

4. LOG ENTRY 3 (Oct 20, 2026) — ADMIN PRIVILEGE & SEPARATION OF DUTIES:
- Asked: "Implement RBAC middleware for Admin, Document Owner, Viewer."
- AI Produced: "if (user.role === 'admin') return true;"
- What Was Wrong: The God-Mode Admin anti-pattern. Admins could snoop private executive salaries and board memos without audit or consent.
- What We Did Instead: Enforced Zero-Trust Separation of Duties. Admins inspect audit logs, but cannot view document content without an explicit grant.

5. LOG ENTRY 4 (Oct 21, 2026) — FILE UPLOAD VALIDATION:
- Asked: "Create a file upload handler that validates uploaded documents."
- AI Produced: Weak mimetype.startsWith('application/') and unvalidated path.join('/uploads', file.name).
- What Was Wrong: MIME spoofing (.exe allowed) and path traversal (../../etc/passwd).
- What We Did Instead: Hardened whitelist, script scanning, and path traversal stripping in uploadValidator.ts.

6. LOG ENTRY 5 (Oct 22, 2026) — SEARCH ENUMERATION LEAKAGE:
- Asked: "Add search and filter for documents."
- AI Produced: Query returning all database rows, hiding unauthorized items in client React.
- What Was Wrong: Metadata leakage via browser DevTools Network tab.
- What We Did Instead: Server-side authorization filtering at the data layer.`;

      case 'api':
        return `# TrustVault — REST API Specification (API.md)

Base URL: /api
Header: X-Actor-Id: <user_id>

ENDPOINTS:
1. GET /api/documents
   Caller: Any authenticated identity. Viewers receive only granted files. Intruders receive empty array.
2. GET /api/documents/:id/read
   Caller: Document Owner or Named Active Grantee.
   Returns: Decrypted payload with dynamic forensic watermark parameters. Logs DOCUMENT_READ or ACCESS_DENIED.
3. GET /api/documents/:id/download
   Caller: Document Owner or Named Active Grantee.
   Returns: Binary stream. Enforces authorization live. Logs DOCUMENT_DOWNLOAD.
4. POST /api/documents
   Caller: Document Owner or Administrator.
   Validates: Magic bytes, MIME whitelist, script injection scanning, SHA-256 integrity hash.
5. DELETE /api/documents/:id
   Caller: Document Owner ONLY.
6. POST /api/documents/:id/permissions
   Caller: Document Owner ONLY.
   Body: { targetUserId, permission: "READ"|"EDIT", expiresMinutes }
7. DELETE /api/documents/:id/permissions/:userId
   Caller: Document Owner ONLY.
   Behavior: Instant revocation. Invalidation of all ephemeral tokens. Next request fails in 0ms.
8. POST /api/documents/:id/ephemeral-link
   Caller: Document Owner or Active Grantee.
   Returns: 60-second time-limited link.
9. GET /api/audit
   Caller: Administrator (Global) or Document Owner (Own documents).
10. POST /api/audit/verify
   Caller: Any auditor or recruiter. Re-hashes entire chain from genesis block #0.`;

      case 'readme':
        return `# TrustVault — System Overview

PRE-SEEDED TEST CREDENTIALS & PERSONAS:
1. Administrator: Sarah Chen (sarah.admin@trustvault.internal)
   - Capabilities: Global audit oversight, chain verification, system configuration.
   - Zero-Trust Policy: Cannot read private document payloads without explicit grant.

2. Document Owner: Alice Vance (alice.vance@trustvault.internal)
   - Department: People Operations & Legal Counsel
   - Owned Documents: Executive Compensation Matrix, SOC-2 Audit Package, Acme MSA.
   - Capabilities: Upload, grant/revoke permissions, inspect document audit trails.

3. Document Owner: Bob Sterling (bob.sterling@trustvault.internal)
   - Department: Strategic Finance & M&A
   - Owned Documents: Project Titan M&A Term Sheet ($48.5M), 409A Option Schedule.

4. Viewer: Charlie Lin (charlie.lin@acme-auditors.org)
   - Role: External Senior Auditor
   - Granted Documents: SOC-2 Audit Package (READ), Acme MSA (EDIT).

5. Viewer: David Miller (david.miller@trustvault.internal)
   - Role: Staff Software Engineer
   - Granted Documents: 409A Option Schedule (READ), Acme MSA (READ).

6. Intruder: Eve Malicious (eve@shadow-threat.net)
   - Role: External Untrusted Attacker attempting IDOR downloads and path traversal.`;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getDocContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="p-5 rounded-xl bg-[#0e1422] border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            Engineering Documentation & Threat Analysis
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Complete technical hand-in artifacts: THREATS.md, PROMPTS.md, API.md, and README.md.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-900 p-1 border border-slate-700/80 rounded-lg">
            <button
              onClick={() => setActiveDoc('threats')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeDoc === 'threats' ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              THREATS.md
            </button>
            <button
              onClick={() => setActiveDoc('prompts')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeDoc === 'prompts' ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              PROMPTS.md
            </button>
            <button
              onClick={() => setActiveDoc('api')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeDoc === 'api' ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              API.md
            </button>
            <button
              onClick={() => setActiveDoc('readme')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeDoc === 'readme' ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              README.md
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
            title="Copy Markdown Document"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Document Content Viewer */}
      <div className="p-6 rounded-xl bg-[#070a12] border border-slate-800/90 font-mono text-xs text-slate-300 leading-relaxed overflow-x-auto whitespace-pre-wrap selection:bg-cyan-500/30 selection:text-white">
        {getDocContent()}
      </div>
    </div>
  );
};
