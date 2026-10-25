/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Role = 'admin' | 'owner' | 'viewer' | 'intruder';

export type DocumentClassification = 'CONFIDENTIAL' | 'RESTRICTED' | 'INTERNAL' | 'PUBLIC';

export type DocumentCategory = 
  | 'Legal & Contracts' 
  | 'Executive & Board' 
  | 'Human Resources' 
  | 'Finance & Equity' 
  | 'Engineering & IP' 
  | 'Compliance & Audit';

export type DocumentPermission = 'READ' | 'EDIT' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: Role;
  department: string;
  avatarUrl?: string;
  ipAddress: string;
}

export interface PermissionGrant {
  id: string;
  documentId: string;
  userId: string;
  userEmail: string;
  userName: string;
  role: Role;
  permission: DocumentPermission;
  grantedBy: string;
  grantedAt: string;
  expiresAt?: string;
  revokedAt?: string;
  revokedBy?: string;
}

export type AuditAction = 
  | 'DOCUMENT_UPLOAD'
  | 'DOCUMENT_READ'
  | 'DOCUMENT_DOWNLOAD'
  | 'DOCUMENT_EDIT'
  | 'DOCUMENT_DELETE'
  | 'PERMISSION_GRANTED'
  | 'PERMISSION_REVOKED'
  | 'ACCESS_DENIED'
  | 'ACCESS_TOKEN_GENERATED'
  | 'ACCESS_TOKEN_REVOKED'
  | 'AUTHENTICATION_SUCCESS'
  | 'TAMPER_DETECTED';

export type AuditStatus = 'ALLOWED' | 'DENIED' | 'FLAGGED';

export interface AuditEvent {
  index: number;
  id: string;
  timestamp: string;
  action: AuditAction;
  actorId: string;
  actorEmail: string;
  actorName: string;
  actorRole: Role;
  actorIp: string;
  documentId?: string;
  documentTitle?: string;
  targetUserId?: string;
  targetUserEmail?: string;
  details: string;
  status: AuditStatus;
  previousHash: string;
  hash: string;
}

export interface VaultDocument {
  id: string;
  title: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  sha256Hash: string;
  category: DocumentCategory;
  classification: DocumentClassification;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  createdAt: string;
  updatedAt: string;
  content: string;
  tags: string[];
  permissions: PermissionGrant[];
  retentionDays?: number;
}

export interface EphemeralAccessToken {
  token: string;
  documentId: string;
  userId: string;
  issuedAt: number;
  expiresAt: number;
  isRevoked: boolean;
}

export interface AttackScenario {
  id: string;
  name: string;
  attacker: User;
  targetDocumentId: string;
  description: string;
  attackVector: string;
  expectedResult: 'FORBIDDEN_403' | 'BAD_REQUEST_400' | 'TAMPER_CAUGHT';
}

export interface AttackSimulationResult {
  scenarioId: string;
  scenarioName: string;
  timestamp: string;
  httpStatus: number;
  passed: boolean;
  serverDecision: string;
  auditEventCreated: AuditEvent;
  threatRef: string;
}
