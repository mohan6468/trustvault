/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { checkDocumentAuthorization, checkAuditLogAccess } from './accessControl.ts';
import { computeSha256, createAuditEvent, verifyChain, calculateEventHash } from './cryptoChain.ts';
import { validateDocumentUpload } from './uploadValidator.ts';
import { VaultDocument, User, AuditEvent } from '../types/index.ts';

const testUsers: Record<string, User> = {
  admin: {
    id: 'usr_admin',
    name: 'Admin Sarah',
    email: 'admin@trustvault.com',
    role: 'admin',
    department: 'Security',
    ipAddress: '10.0.0.1'
  },
  owner: {
    id: 'usr_owner_alice',
    name: 'Alice Owner',
    email: 'alice@trustvault.com',
    role: 'owner',
    department: 'Legal',
    ipAddress: '10.0.0.2'
  },
  viewerAllowed: {
    id: 'usr_viewer_charlie',
    name: 'Charlie Viewer',
    email: 'charlie@auditors.org',
    role: 'viewer',
    department: 'Audit',
    ipAddress: '198.51.100.5'
  },
  viewerDenied: {
    id: 'usr_viewer_david',
    name: 'David Viewer',
    email: 'david@trustvault.com',
    role: 'viewer',
    department: 'Eng',
    ipAddress: '10.0.0.4'
  },
  intruder: {
    id: 'usr_intruder_eve',
    name: 'Eve Attacker',
    email: 'eve@evil.com',
    role: 'intruder',
    department: 'External',
    ipAddress: '203.0.113.9'
  }
};

const createMockDoc = (overrides: Partial<VaultDocument> = {}): VaultDocument => ({
  id: 'doc_payroll_2026',
  title: 'Executive Salaries 2026',
  filename: 'payroll_2026.pdf',
  fileSize: 1024,
  mimeType: 'application/pdf',
  sha256Hash: 'dummyhash123',
  category: 'Human Resources',
  classification: 'RESTRICTED',
  ownerId: 'usr_owner_alice',
  ownerName: 'Alice Owner',
  ownerEmail: 'alice@trustvault.com',
  createdAt: '2026-10-20T00:00:00Z',
  updatedAt: '2026-10-20T00:00:00Z',
  content: 'Salary details...',
  tags: ['Confidential'],
  permissions: [
    {
      id: 'grant_1',
      documentId: 'doc_payroll_2026',
      userId: 'usr_viewer_charlie',
      userEmail: 'charlie@auditors.org',
      userName: 'Charlie Viewer',
      role: 'viewer',
      permission: 'READ',
      grantedBy: 'usr_owner_alice',
      grantedAt: '2026-10-20T01:00:00Z'
    }
  ],
  ...overrides
});

test('INVARIANT 1: Document Owner has full access to read, edit, and delete', () => {
  const doc = createMockDoc();
  const readAuth = checkDocumentAuthorization(testUsers.owner, doc, 'READ');
  assert.equal(readAuth.allowed, true);
  assert.equal(readAuth.isOwner, true);

  const editAuth = checkDocumentAuthorization(testUsers.owner, doc, 'EDIT');
  assert.equal(editAuth.allowed, true);

  const delAuth = checkDocumentAuthorization(testUsers.owner, doc, 'DELETE');
  assert.equal(delAuth.allowed, true);
});

test('INVARIANT 2: Unassigned user cannot read document (IDOR defense)', () => {
  const doc = createMockDoc();
  const auth = checkDocumentAuthorization(testUsers.viewerDenied, doc, 'READ');
  assert.equal(auth.allowed, false, 'Unassigned viewer must be denied access');
  assert.match(auth.reason || '', /No active permission grant exists/);
});

test('INVARIANT 3: External intruder has zero access across all actions', () => {
  const doc = createMockDoc();
  const readAuth = checkDocumentAuthorization(testUsers.intruder, doc, 'READ');
  assert.equal(readAuth.allowed, false);

  const editAuth = checkDocumentAuthorization(testUsers.intruder, doc, 'EDIT');
  assert.equal(editAuth.allowed, false);
});

test('INVARIANT 4: Instant Revocation nullifies access immediately', () => {
  const doc = createMockDoc();

  // Initially allowed
  const initialAuth = checkDocumentAuthorization(testUsers.viewerAllowed, doc, 'READ');
  assert.equal(initialAuth.allowed, true);

  // Revoke grant
  const grant = doc.permissions.find(p => p.userId === testUsers.viewerAllowed.id)!;
  grant.revokedAt = new Date().toISOString();
  grant.revokedBy = 'Alice Owner';

  // Check immediately afterwards
  const revokedAuth = checkDocumentAuthorization(testUsers.viewerAllowed, doc, 'READ');
  assert.equal(revokedAuth.allowed, false, 'Access must be denied immediately after revocation');
  assert.match(revokedAuth.reason || '', /revoked/i);
});

test('INVARIANT 5: Zero-Trust Separation of Duties - Administrator cannot read confidential payload without explicit grant', () => {
  const doc = createMockDoc();
  const adminAuth = checkDocumentAuthorization(testUsers.admin, doc, 'READ');
  assert.equal(adminAuth.allowed, false, 'Administrator should not bypass zero-trust to read payload');
  assert.match(adminAuth.reason || '', /Zero-Trust/i);
});

test('INVARIANT 6: Tamper-Evident Hash Chaining catches stealth database alterations', () => {
  const chain: AuditEvent[] = [];

  const evt0 = createAuditEvent({
    chain,
    action: 'AUTHENTICATION_SUCCESS',
    actorId: 'usr_admin',
    actorEmail: 'admin@trustvault.com',
    actorName: 'Admin Sarah',
    actorRole: 'admin',
    actorIp: '10.0.0.1',
    details: 'Ledger init',
    status: 'ALLOWED'
  });
  chain.push(evt0);

  const evt1 = createAuditEvent({
    chain,
    action: 'DOCUMENT_READ',
    actorId: 'usr_viewer_charlie',
    actorEmail: 'charlie@auditors.org',
    actorName: 'Charlie Viewer',
    actorRole: 'viewer',
    actorIp: '198.51.100.5',
    documentId: 'doc_payroll_2026',
    details: 'Viewed payroll file',
    status: 'ALLOWED'
  });
  chain.push(evt1);

  // Chain is initially valid
  const initialCheck = verifyChain(chain);
  assert.equal(initialCheck.valid, true);
  assert.equal(initialCheck.verifiedBlocks, 2);

  // Attacker tampers with evt1 details in DB without updating hash
  chain[1].details = 'Altered stealth content: Charlie never read this';

  const tamperedCheck = verifyChain(chain);
  assert.equal(tamperedCheck.valid, false, 'Tampered block must fail cryptographic verification');
  assert.equal(tamperedCheck.errorIndex, 1);
  assert.match(tamperedCheck.reason || '', /Tampering detected/i);
});

test('INVARIANT 7: Upload validation rejects dangerous executables, scripts, and path traversal', () => {
  // 1. Executable file
  const exeResult = validateDocumentUpload('invoice_malware.exe', 'MZ binary payload');
  assert.equal(exeResult.valid, false);
  assert.match(exeResult.errors.join(' '), /executable/i);

  // 2. Path traversal
  const traversalResult = validateDocumentUpload('../../etc/passwd.txt', 'root:x:0:0');
  assert.equal(traversalResult.valid, false);
  assert.match(traversalResult.errors.join(' '), /Path traversal/i);

  // 3. Stored XSS in document content
  const xssResult = validateDocumentUpload('contract.txt', '<script>alert(document.cookie)</script>');
  assert.equal(xssResult.valid, false);
  assert.match(xssResult.errors.join(' '), /embedded executable script/i);

  // 4. Valid corporate PDF
  const validResult = validateDocumentUpload('valid_agreement.pdf', '%PDF-1.7 valid content');
  assert.equal(validResult.valid, true);
  assert.equal(validResult.sanitizedFilename, 'valid_agreement.pdf');
  assert.equal(validResult.mimeType, 'application/pdf');
  assert.ok(validResult.sha256Hash.length === 64);
});
