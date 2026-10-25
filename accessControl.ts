/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { DocumentPermission, PermissionGrant, User, VaultDocument } from '../types/index.ts';

export interface AuthorizationResult {
  allowed: boolean;
  reason?: string;
  grant?: PermissionGrant;
  isOwner?: boolean;
  isAdmin?: boolean;
}

/**
 * Evaluates whether a user is authorized to perform an action on a document.
 * 
 * Invariants:
 * 1. Document Owner has full read/edit/grant/revoke/delete rights.
 * 2. Viewer MUST have an ACTIVE (non-revoked, non-expired) grant explicitly naming their userId.
 * 3. Administrator has governance/audit rights, but CANNOT read private document content
 *    unless explicitly granted access (enforcing Separation of Duties & Zero-Trust).
 * 4. Revocation is instantaneous: any revokedAt timestamp renders the grant immediately void.
 * 5. Time-limited grants automatically invalidate once expiresAt is in the past.
 */
export function checkDocumentAuthorization(
  user: User,
  document: VaultDocument,
  requiredPermission: 'READ' | 'EDIT' | 'DELETE' | 'GRANT' = 'READ'
): AuthorizationResult {
  // 1. Untrusted intruder role is always denied
  if (user.role === 'intruder') {
    return {
      allowed: false,
      reason: 'Untrusted external actor has zero privileges in TrustVault.'
    };
  }

  // 2. Owner of document has complete control
  if (document.ownerId === user.id) {
    return {
      allowed: true,
      isOwner: true,
      reason: 'User is verified Document Owner.'
    };
  }

  // 3. Document deletion is restricted strictly to the Document Owner
  if (requiredPermission === 'DELETE') {
    return {
      allowed: false,
      reason: 'Only the Document Owner can delete this document.'
    };
  }

  // 4. Granting permissions is restricted strictly to the Document Owner
  if (requiredPermission === 'GRANT') {
    return {
      allowed: false,
      reason: 'Only the Document Owner can grant or revoke permissions.'
    };
  }

  // 5. Check active named grants
  const now = new Date().toISOString();
  const userGrant = document.permissions.find(g => g.userId === user.id);

  if (userGrant) {
    // Check if access was revoked
    if (userGrant.revokedAt) {
      return {
        allowed: false,
        grant: userGrant,
        reason: `Access was revoked on ${new Date(userGrant.revokedAt).toLocaleString()} by ${userGrant.revokedBy || 'Owner'}.`
      };
    }

    // Check if grant has expired
    if (userGrant.expiresAt && userGrant.expiresAt < now) {
      return {
        allowed: false,
        grant: userGrant,
        reason: `Access grant expired at ${new Date(userGrant.expiresAt).toLocaleString()}.`
      };
    }

    // Check permission level
    if (requiredPermission === 'EDIT' && userGrant.permission !== 'EDIT' && userGrant.permission !== 'ADMIN') {
      return {
        allowed: false,
        grant: userGrant,
        reason: 'User has READ permission only, but EDIT permission was requested.'
      };
    }

    return {
      allowed: true,
      grant: userGrant,
      reason: `Authorized via active grant (${userGrant.permission}).`
    };
  }

  // 6. Administrator Zero-Trust policy:
  // Admins can see metadata, audit trails, and manage system policies,
  // but cannot inspect confidential payload content without an explicit grant.
  if (user.role === 'admin') {
    return {
      allowed: false,
      isAdmin: true,
      reason: 'Zero-Trust Policy: Administrators cannot read confidential document payloads without an explicit grant from the Document Owner.'
    };
  }

  // 7. Default deny for all unassigned users
  return {
    allowed: false,
    reason: 'Access Denied: No active permission grant exists for this user.'
  };
}

/**
 * Checks if a user has administrative permission to inspect the global audit trail.
 * Document owners can inspect audit trails for their own documents.
 * Administrators can inspect system-wide audit trails.
 */
export function checkAuditLogAccess(user: User, document?: VaultDocument): AuthorizationResult {
  if (user.role === 'admin') {
    return { allowed: true, isAdmin: true, reason: 'Administrator has forensic audit inspection privileges.' };
  }

  if (document && document.ownerId === user.id) {
    return { allowed: true, isOwner: true, reason: 'Document Owner can inspect audit records for their own documents.' };
  }

  return {
    allowed: false,
    reason: 'Access Denied: Only administrators and the document owner can inspect audit trail records.'
  };
}
