/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AttackSimulationResult,
  AuditEvent,
  DocumentCategory,
  DocumentClassification,
  DocumentPermission,
  User,
  VaultDocument
} from '../types';
import { vaultService } from './vaultService';
import { ChainVerificationResult } from '../security/cryptoChain';

/**
 * Robust API Client that calls server endpoints via HTTP fetch,
 * with seamless fallback to in-memory vaultService if running in standalone mode.
 */
class ApiClient {
  private currentActor: User = vaultService.getUsers()[1]; // Alice Vance (Owner) by default

  public setActor(user: User) {
    this.currentActor = user;
  }

  public getActor(): User {
    return this.currentActor;
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'X-Actor-Id': this.currentActor.id
    };
  }

  public async login(email: string, password?: string): Promise<{ status: number; user?: User; error?: string }> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok && data.user) {
        this.setActor(data.user);
      }
      return data;
    } catch {}
    const localRes = vaultService.login(email, password);
    if (localRes.user) {
      this.setActor(localRes.user);
    }
    return localRes;
  }

  public async getUsers(): Promise<User[]> {
    try {
      const res = await fetch('/api/users', { headers: this.getHeaders() });
      if (res.ok) return await res.json();
    } catch {}
    return vaultService.getUsers();
  }

  public async getDocuments(options?: { search?: string; category?: string; ownerId?: string }): Promise<VaultDocument[]> {
    try {
      const params = new URLSearchParams();
      if (options?.search) params.set('search', options.search);
      if (options?.category) params.set('category', options.category);
      if (options?.ownerId) params.set('ownerId', options.ownerId);

      const res = await fetch(`/api/documents?${params.toString()}`, { headers: this.getHeaders() });
      if (res.ok) return await res.json();
    } catch {}
    return vaultService.getDocuments(this.currentActor, options);
  }

  public async readDocument(documentId: string): Promise<{
    status: number;
    content?: string;
    watermarkText?: string;
    document?: VaultDocument;
    error?: string;
  }> {
    try {
      const res = await fetch(`/api/documents/${documentId}/read`, { headers: this.getHeaders() });
      return await res.json();
    } catch {}
    return vaultService.readDocumentContent(this.currentActor, documentId);
  }

  public async downloadDocument(documentId: string): Promise<{
    status: number;
    filename?: string;
    mimeType?: string;
    content?: string;
    error?: string;
  }> {
    try {
      const res = await fetch(`/api/documents/${documentId}/download`, { headers: this.getHeaders() });
      if (res.ok) {
        const content = await res.text();
        const disposition = res.headers.get('Content-Disposition') || '';
        const filenameMatch = disposition.match(/filename="(.+)"/);
        const filename = filenameMatch ? filenameMatch[1] : `document_${documentId}.txt`;
        const mimeType = res.headers.get('Content-Type') || 'application/octet-stream';
        return { status: 200, filename, mimeType, content };
      }
      const data = await res.json();
      return { status: res.status, error: data.error };
    } catch {}
    return vaultService.downloadDocument(this.currentActor, documentId);
  }

  public async uploadDocument(data: {
    title: string;
    filename: string;
    content: string;
    category: DocumentCategory;
    classification: DocumentClassification;
    tags?: string[];
  }): Promise<{ status: number; document?: VaultDocument; errors?: string[] }> {
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch {}
    return vaultService.uploadDocument(this.currentActor, data);
  }

  public async deleteDocument(documentId: string): Promise<{ status: number; success: boolean; error?: string }> {
    try {
      const res = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });
      return await res.json();
    } catch {}
    return vaultService.deleteDocument(this.currentActor, documentId);
  }

  public async grantPermission(
    documentId: string,
    targetUserId: string,
    permission: DocumentPermission,
    expiresMinutes?: number
  ) {
    try {
      const res = await fetch(`/api/documents/${documentId}/permissions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ targetUserId, permission, expiresMinutes })
      });
      return await res.json();
    } catch {}
    return vaultService.grantPermission(this.currentActor, documentId, targetUserId, permission, expiresMinutes);
  }

  public async revokePermission(documentId: string, targetUserId: string) {
    try {
      const res = await fetch(`/api/documents/${documentId}/permissions/${targetUserId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });
      return await res.json();
    } catch {}
    return vaultService.revokePermission(this.currentActor, documentId, targetUserId);
  }

  public async generateEphemeralLink(documentId: string, durationSeconds: number) {
    try {
      const res = await fetch(`/api/documents/${documentId}/ephemeral-link`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ durationSeconds })
      });
      return await res.json();
    } catch {}
    return vaultService.generateEphemeralAccessToken(this.currentActor, documentId, durationSeconds);
  }

  public async getAuditTrail(documentId?: string): Promise<{ status: number; events: AuditEvent[]; error?: string }> {
    try {
      const url = documentId ? `/api/audit?documentId=${encodeURIComponent(documentId)}` : '/api/audit';
      const res = await fetch(url, { headers: this.getHeaders() });
      return await res.json();
    } catch {}
    return vaultService.getAuditTrail(this.currentActor, documentId);
  }

  public async verifyAuditTrail(): Promise<ChainVerificationResult> {
    try {
      const res = await fetch('/api/audit/verify', { method: 'POST', headers: this.getHeaders() });
      return await res.json();
    } catch {}
    return vaultService.verifyAuditTrailIntegrity();
  }

  public async simulateTamperAttack(blockIndex: number, fakeDetails: string) {
    try {
      const res = await fetch('/api/audit/tamper-demo', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ blockIndex, fakeDetails })
      });
      return await res.json();
    } catch {}
    return vaultService.simulateTamperAttack(blockIndex, fakeDetails);
  }

  public async restoreAuditTrail() {
    try {
      const res = await fetch('/api/audit/restore-demo', { method: 'POST', headers: this.getHeaders() });
      return await res.json();
    } catch {}
    vaultService.restoreChainIntegrity();
    return { success: true };
  }

  public async runPenetrationTest(scenarioId: string): Promise<AttackSimulationResult> {
    try {
      const res = await fetch('/api/test/penetration', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ scenarioId })
      });
      return await res.json();
    } catch {}
    return await vaultService.runSecurityPenetrationTest(scenarioId);
  }
}

export const apiClient = new ApiClient();
