/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { AuditEvent, PermissionGrant, User, VaultDocument } from '../types/index.ts';
import { createAuditEvent, GENESIS_PREVIOUS_HASH } from '../security/cryptoChain.ts';

export const SEED_USERS: User[] = [
  {
    id: 'usr_admin_01',
    name: 'Sarah Chen',
    email: 'sarah.admin@trustvault.internal',
    password: 'AdminPassword2026!',
    role: 'admin',
    department: 'Global Security & Compliance',
    ipAddress: '192.168.1.10'
  },
  {
    id: 'usr_owner_alice',
    name: 'Alice Vance',
    email: 'alice.vance@trustvault.internal',
    password: 'OwnerPassword2026!',
    role: 'owner',
    department: 'People Operations & Legal Counsel',
    ipAddress: '192.168.1.42'
  },
  {
    id: 'usr_owner_bob',
    name: 'Bob Sterling',
    email: 'bob.sterling@trustvault.internal',
    password: 'OwnerPassword2026!',
    role: 'owner',
    department: 'Corporate Finance & M&A',
    ipAddress: '192.168.1.88'
  },
  {
    id: 'usr_viewer_charlie',
    name: 'Charlie Lin',
    email: 'charlie.lin@acme-auditors.org',
    password: 'ViewerPassword2026!',
    role: 'viewer',
    department: 'Independent Audit Firm (SOC-2 Assessor)',
    ipAddress: '198.51.100.24'
  },
  {
    id: 'usr_viewer_david',
    name: 'David Miller',
    email: 'david.miller@trustvault.internal',
    password: 'ViewerPassword2026!',
    role: 'viewer',
    department: 'Core Infrastructure Engineering',
    ipAddress: '192.168.1.105'
  },
  {
    id: 'usr_intruder_eve',
    name: 'Eve Malicious (Attacker Persona)',
    email: 'eve@shadow-threat.net',
    password: 'IntruderPassword2026!',
    role: 'intruder',
    department: 'Unauthenticated Foreign Network',
    ipAddress: '203.0.113.199'
  }
];

export const INITIAL_DOCUMENTS: VaultDocument[] = [
  {
    id: 'doc_exec_comp_2026',
    title: 'Executive Compensation & 2026 Bonus Matrix',
    filename: 'executive_compensation_2026.pdf',
    fileSize: 184520,
    mimeType: 'application/pdf',
    sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    category: 'Human Resources',
    classification: 'RESTRICTED',
    ownerId: 'usr_owner_alice',
    ownerName: 'Alice Vance',
    ownerEmail: 'alice.vance@trustvault.internal',
    createdAt: '2026-10-18T09:15:00Z',
    updatedAt: '2026-10-18T09:15:00Z',
    content: `RESTRICTED & HIGHLY CONFIDENTIAL
TRUSTVAULT CORPORATION - COMPENSATION COMMITTEE RESOLUTION
Document Serial: TV-EXEC-2026-0881
Classification: STRICT INTERNAL RESTRICTED

1. EXECUTIVE BONUS POOL ALLOCATION (FY2026)
- Chief Executive Officer: $420,000 base salary, 120% target performance multiplier.
- Chief Financial Officer: $360,000 base salary, 85% target bonus.
- VP Engineering: $340,000 base salary, 60,000 Series-B Incentive Stock Options (ISO).

2. RETENTION RESTRICTED STOCK UNITS (RSU)
Total reserve pool authorized: 1,500,000 common equivalents vesting quarterly over 48 months with a 1-year cliff.

NOTICE: Unauthorized extraction, viewing, or transmission of this salary schedule constitutes a direct breach of corporate fiduciary duty and will trigger immediate legal revocation and audit trace.`,
    tags: ['Executive', 'Salaries', 'Strict Confidential', 'Legal'],
    permissions: [] // Intentionally restricted to Alice Vance only
  },
  {
    id: 'doc_acquisition_titan',
    title: 'Project Titan M&A Term Sheet & Cap Table',
    filename: 'project_titan_term_sheet.docx',
    fileSize: 312890,
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    sha256Hash: 'a7c9f28d8b394145b4c1e48349fa893f41e549b934ca495991b7852b855e921b',
    category: 'Finance & Equity',
    classification: 'CONFIDENTIAL',
    ownerId: 'usr_owner_bob',
    ownerName: 'Bob Sterling',
    ownerEmail: 'bob.sterling@trustvault.internal',
    createdAt: '2026-10-19T14:30:00Z',
    updatedAt: '2026-10-19T14:30:00Z',
    content: `CONFIDENTIAL PROJECT TITAN ACQUISITION AGREEMENT
Between TrustVault Inc. and Project Titan Holdings BV
Draft Version: 4.2 - Subject to Board Ratification

1. TRANSACTION STRUCTURE
Acquisition of 100% of Titan outstanding voting equity for an enterprise consideration of $48,500,000 USD (65% cash consideration, 35% TrustVault Series-C Preferred Stock).

2. ESCROW & INDEMNIFICATION
Ten percent (10%) of cash consideration ($3,152,500) to be held in third-party escrow for eighteen (18) months following closing date to satisfy customary representation breaches.

3. GOVERNING JURISDICTION & ARBITRATION
Delaware General Corporation Law (DGCL) with binding commercial arbitration in New York, NY.`,
    tags: ['M&A', 'Finance', 'Term Sheet', 'Board Only'],
    permissions: [] // Restricted to Bob Sterling
  },
  {
    id: 'doc_soc2_audit_evidence',
    title: 'Q3 SOC-2 Type II Independent Audit Evidence Package',
    filename: 'soc2_type2_audit_evidence.pdf',
    fileSize: 498210,
    mimeType: 'application/pdf',
    sha256Hash: 'f4b2a8d11c394145b4c1e48349fa893f41e549b934ca495991b7852b855ec819',
    category: 'Compliance & Audit',
    classification: 'CONFIDENTIAL',
    ownerId: 'usr_owner_alice',
    ownerName: 'Alice Vance',
    ownerEmail: 'alice.vance@trustvault.internal',
    createdAt: '2026-10-20T11:00:00Z',
    updatedAt: '2026-10-20T11:00:00Z',
    content: `TRUSTVAULT SOC-2 TYPE II AUDIT EVIDENCE REPOSITORY
Audit Period: July 1, 2026 - September 30, 2026
Prepared for: Independent Assessor (Charlie Lin / Acme Auditors)

CONTROL CC6.1 - LOGICAL ACCESS CONTROLS:
- Multi-factor authentication enforced on 100% of internal accounts.
- Ephemeral access tokens expire after 300 seconds of inactivity.
- Instant access revocation takes effect across all running sessions within 0 milliseconds via server-side active grant validation.

CONTROL CC6.6 - AUDIT TRAIL IMMUTABILITY:
- All administrative, read, write, and denied attempts are committed to a SHA-256 cryptographic hash-chain.
- Any attempt to alter historical records breaks the hash linkage, rendering forensic proof verifiable by external auditors.`,
    tags: ['SOC-2', 'Compliance', 'Auditor Shared', 'Evidence'],
    permissions: [
      {
        id: 'perm_soc2_charlie',
        documentId: 'doc_soc2_audit_evidence',
        userId: 'usr_viewer_charlie',
        userEmail: 'charlie.lin@acme-auditors.org',
        userName: 'Charlie Lin',
        role: 'viewer',
        permission: 'READ',
        grantedBy: 'usr_owner_alice',
        grantedAt: '2026-10-20T11:15:00Z'
      }
    ]
  },
  {
    id: 'doc_stock_option_schedule',
    title: 'Employee Stock Option Pool & 409A Valuation Schedule',
    filename: 'stock_option_pool_409a.xlsx',
    fileSize: 142100,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    sha256Hash: 'c819a7c9f28d8b394145b4c1e48349fa893f41e549b934ca495991b7852b855e',
    category: 'Finance & Equity',
    classification: 'RESTRICTED',
    ownerId: 'usr_owner_bob',
    ownerName: 'Bob Sterling',
    ownerEmail: 'bob.sterling@trustvault.internal',
    createdAt: '2026-10-21T08:45:00Z',
    updatedAt: '2026-10-21T08:45:00Z',
    content: `TRUSTVAULT INC. - 409A VALUATION & OPTION SCHEDULE
Fair Market Value (FMV) per Common Share: $4.18
Total Authorized Option Pool: 3,200,000 shares
Granted: 2,410,000 | Available for Issuance: 790,000

ENGINEERING DEPARTMENT GRANTS:
- David Miller (Staff Engineer): 28,000 shares @ $1.25 strike price. Status: Active.
- Vesting Schedule: Standard 4-year schedule with 25% after 12 months, 1/48th per month thereafter.`,
    tags: ['Cap Table', '409A', 'Equity', 'Staff Grants'],
    permissions: [
      {
        id: 'perm_options_david',
        documentId: 'doc_stock_option_schedule',
        userId: 'usr_viewer_david',
        userEmail: 'david.miller@trustvault.internal',
        userName: 'David Miller',
        role: 'viewer',
        permission: 'READ',
        grantedBy: 'usr_owner_bob',
        grantedAt: '2026-10-21T09:00:00Z'
      }
    ]
  },
  {
    id: 'doc_msa_acme_corp',
    title: 'Customer Master Services Agreement & DPA - Acme Corp',
    filename: 'msa_dpa_acme_corp.pdf',
    fileSize: 256400,
    mimeType: 'application/pdf',
    sha256Hash: 'b4c1e48349fa893f41e549b934ca495991b7852b855ea7c9f28d8b394145b819',
    category: 'Legal & Contracts',
    classification: 'CONFIDENTIAL',
    ownerId: 'usr_owner_alice',
    ownerName: 'Alice Vance',
    ownerEmail: 'alice.vance@trustvault.internal',
    createdAt: '2026-10-22T16:00:00Z',
    updatedAt: '2026-10-22T16:00:00Z',
    content: `MASTER SERVICES AGREEMENT (MSA) & DATA PROCESSING ADDENDUM
Customer: Acme Corporation
Vendor: TrustVault Systems Inc.
Annual Recurring Value: $180,000 USD / yr

SECTION 4. DATA SECURITY COMMITMENTS:
TrustVault shall maintain zero-trust logical separation of all customer materials.
Any individual accessing Customer records must be named explicitly in the access ledger.
Customer shall have audit rights to request tamper-evident proof of all view and download transactions within 24 hours of written notice.`,
    tags: ['MSA', 'Legal', 'Enterprise Customer', 'DPA'],
    permissions: [
      {
        id: 'perm_msa_david',
        documentId: 'doc_msa_acme_corp',
        userId: 'usr_viewer_david',
        userEmail: 'david.miller@trustvault.internal',
        userName: 'David Miller',
        role: 'viewer',
        permission: 'READ',
        grantedBy: 'usr_owner_alice',
        grantedAt: '2026-10-22T16:15:00Z'
      },
      {
        id: 'perm_msa_charlie',
        documentId: 'doc_msa_acme_corp',
        userId: 'usr_viewer_charlie',
        userEmail: 'charlie.lin@acme-auditors.org',
        userName: 'Charlie Lin',
        role: 'viewer',
        permission: 'EDIT',
        grantedBy: 'usr_owner_alice',
        grantedAt: '2026-10-22T16:20:00Z'
      }
    ]
  }
];

export function buildGenesisAuditChain(): AuditEvent[] {
  const chain: AuditEvent[] = [];

  // Genesis event
  const genesis = createAuditEvent({
    chain,
    action: 'AUTHENTICATION_SUCCESS',
    actorId: 'usr_admin_01',
    actorEmail: 'sarah.admin@trustvault.internal',
    actorName: 'Sarah Chen',
    actorRole: 'admin',
    actorIp: '192.168.1.10',
    details: 'TrustVault cryptographic security ledger initialized. Zero-trust root key established.',
    status: 'ALLOWED',
    customTimestamp: '2026-10-18T08:00:00Z'
  });
  chain.push(genesis);

  // Alice uploads Executive Compensation
  const evt1 = createAuditEvent({
    chain,
    action: 'DOCUMENT_UPLOAD',
    actorId: 'usr_owner_alice',
    actorEmail: 'alice.vance@trustvault.internal',
    actorName: 'Alice Vance',
    actorRole: 'owner',
    actorIp: '192.168.1.42',
    documentId: 'doc_exec_comp_2026',
    documentTitle: 'Executive Compensation & 2026 Bonus Matrix',
    details: 'Uploaded RESTRICTED salary matrix. Access strictly locked to Document Owner.',
    status: 'ALLOWED',
    customTimestamp: '2026-10-18T09:15:00Z'
  });
  chain.push(evt1);

  // Bob uploads Project Titan M&A Term Sheet
  const evt2 = createAuditEvent({
    chain,
    action: 'DOCUMENT_UPLOAD',
    actorId: 'usr_owner_bob',
    actorEmail: 'bob.sterling@trustvault.internal',
    actorName: 'Bob Sterling',
    actorRole: 'owner',
    actorIp: '192.168.1.88',
    documentId: 'doc_acquisition_titan',
    documentTitle: 'Project Titan M&A Term Sheet & Cap Table',
    details: 'Uploaded M&A term sheet ($48.5M). Classification: CONFIDENTIAL.',
    status: 'ALLOWED',
    customTimestamp: '2026-10-19T14:30:00Z'
  });
  chain.push(evt2);

  // Alice uploads SOC-2 Audit evidence
  const evt3 = createAuditEvent({
    chain,
    action: 'DOCUMENT_UPLOAD',
    actorId: 'usr_owner_alice',
    actorEmail: 'alice.vance@trustvault.internal',
    actorName: 'Alice Vance',
    actorRole: 'owner',
    actorIp: '192.168.1.42',
    documentId: 'doc_soc2_audit_evidence',
    documentTitle: 'Q3 SOC-2 Type II Independent Audit Evidence Package',
    details: 'Uploaded SOC-2 compliance package for external auditor assessment.',
    status: 'ALLOWED',
    customTimestamp: '2026-10-20T11:00:00Z'
  });
  chain.push(evt3);

  // Alice grants READ access to Charlie Lin for SOC-2
  const evt4 = createAuditEvent({
    chain,
    action: 'PERMISSION_GRANTED',
    actorId: 'usr_owner_alice',
    actorEmail: 'alice.vance@trustvault.internal',
    actorName: 'Alice Vance',
    actorRole: 'owner',
    actorIp: '192.168.1.42',
    documentId: 'doc_soc2_audit_evidence',
    documentTitle: 'Q3 SOC-2 Type II Independent Audit Evidence Package',
    targetUserId: 'usr_viewer_charlie',
    targetUserEmail: 'charlie.lin@acme-auditors.org',
    details: 'Granted named READ access to Charlie Lin (External Auditor).',
    status: 'ALLOWED',
    customTimestamp: '2026-10-20T11:15:00Z'
  });
  chain.push(evt4);

  // Charlie Lin views SOC-2 document
  const evt5 = createAuditEvent({
    chain,
    action: 'DOCUMENT_READ',
    actorId: 'usr_viewer_charlie',
    actorEmail: 'charlie.lin@acme-auditors.org',
    actorName: 'Charlie Lin',
    actorRole: 'viewer',
    actorIp: '198.51.100.24',
    documentId: 'doc_soc2_audit_evidence',
    documentTitle: 'Q3 SOC-2 Type II Independent Audit Evidence Package',
    details: 'Opened secure watermarked viewer session. Watermark: charlie.lin@acme-auditors.org.',
    status: 'ALLOWED',
    customTimestamp: '2026-10-20T11:22:00Z'
  });
  chain.push(evt5);

  // Suspicious probe: Charlie Lin attempts to access Executive Compensation document (Unassigned) -> REFUSED
  const evt6 = createAuditEvent({
    chain,
    action: 'ACCESS_DENIED',
    actorId: 'usr_viewer_charlie',
    actorEmail: 'charlie.lin@acme-auditors.org',
    actorName: 'Charlie Lin',
    actorRole: 'viewer',
    actorIp: '198.51.100.24',
    documentId: 'doc_exec_comp_2026',
    documentTitle: 'Executive Compensation & 2026 Bonus Matrix',
    details: 'Unauthorized attempt to inspect unassigned restricted document doc_exec_comp_2026. HTTP 403 Forbidden returned by server.',
    status: 'DENIED',
    customTimestamp: '2026-10-20T11:45:00Z'
  });
  chain.push(evt6);

  // Bob uploads Stock Option schedule
  const evt7 = createAuditEvent({
    chain,
    action: 'DOCUMENT_UPLOAD',
    actorId: 'usr_owner_bob',
    actorEmail: 'bob.sterling@trustvault.internal',
    actorName: 'Bob Sterling',
    actorRole: 'owner',
    actorIp: '192.168.1.88',
    documentId: 'doc_stock_option_schedule',
    documentTitle: 'Employee Stock Option Pool & 409A Valuation Schedule',
    details: 'Uploaded 409A valuation schedule.',
    status: 'ALLOWED',
    customTimestamp: '2026-10-21T08:45:00Z'
  });
  chain.push(evt7);

  // Bob grants READ to David Miller
  const evt8 = createAuditEvent({
    chain,
    action: 'PERMISSION_GRANTED',
    actorId: 'usr_owner_bob',
    actorEmail: 'bob.sterling@trustvault.internal',
    actorName: 'Bob Sterling',
    actorRole: 'owner',
    actorIp: '192.168.1.88',
    documentId: 'doc_stock_option_schedule',
    documentTitle: 'Employee Stock Option Pool & 409A Valuation Schedule',
    targetUserId: 'usr_viewer_david',
    targetUserEmail: 'david.miller@trustvault.internal',
    details: 'Granted named READ access to David Miller for equity schedule.',
    status: 'ALLOWED',
    customTimestamp: '2026-10-21T09:00:00Z'
  });
  chain.push(evt8);

  // Alice uploads MSA
  const evt9 = createAuditEvent({
    chain,
    action: 'DOCUMENT_UPLOAD',
    actorId: 'usr_owner_alice',
    actorEmail: 'alice.vance@trustvault.internal',
    actorName: 'Alice Vance',
    actorRole: 'owner',
    actorIp: '192.168.1.42',
    documentId: 'doc_msa_acme_corp',
    documentTitle: 'Customer Master Services Agreement & DPA - Acme Corp',
    details: 'Uploaded executed enterprise contract.',
    status: 'ALLOWED',
    customTimestamp: '2026-10-22T16:00:00Z'
  });
  chain.push(evt9);

  return chain;
}
