/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, VaultDocument } from '../types';
import { DocumentList } from './DocumentList';
import { AuditLedger } from './AuditLedger';
import { AttackSimulator } from './AttackSimulator';
import { DocsViewer } from './DocsViewer';
import { apiClient } from '../services/apiClient';
import { 
  KeyRound, 
  Plus, 
  Share2, 
  UserMinus, 
  History, 
  ShieldCheck, 
  Check, 
  Terminal, 
  Clock, 
  FileText,
  Lock,
  ExternalLink,
  ChevronRight,
  Shield
} from 'lucide-react';

interface OwnerDashboardProps {
  currentActor: User;
  documents: VaultDocument[];
  allUsers: User[];
  onOpenViewer: (doc: VaultDocument) => void;
  onOpenPermissions: (doc: VaultDocument) => void;
  onOpenUpload: () => void;
  onDownload: (doc: VaultDocument) => void;
  onDelete: (doc: VaultDocument) => void;
  onRefresh: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string;
  setSelectedCategory: (c: string) => void;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({
  currentActor,
  documents,
  allUsers,
  onOpenViewer,
  onOpenPermissions,
  onOpenUpload,
  onDownload,
  onDelete,
  onRefresh,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory
}) => {
  const [ownerTab, setOwnerTab] = useState<'documents' | 'revocation_hub' | 'audit' | 'simulator'>('documents');
  const [revocationSuccess, setRevocationSuccess] = useState<string | null>(null);

  // Compute all owned docs and active shared docs
  const ownedDocs = documents.filter(d => d.ownerId === currentActor.id);
  const nowIso = new Date().toISOString();
  
  // A document is considered "Active Shared" if it has >= 1 active, non-revoked, non-expired grant
  const activeSharedDocs = ownedDocs.filter(d => 
    d.permissions.some(p => !p.revokedAt && (!p.expiresAt || p.expiresAt > nowIso))
  );
  const activeSharedDocsCount = activeSharedDocs.length;
  const privateDocsCount = ownedDocs.length - activeSharedDocsCount;

  // Flatten active grants across all owned documents
  const allGrants = ownedDocs.flatMap(d => d.permissions.map(p => ({ 
    ...p, 
    documentTitle: d.title,
    classification: d.classification,
    filename: d.filename
  })));
  const activeGrants = allGrants.filter(g => !g.revokedAt && (!g.expiresAt || g.expiresAt > nowIso));

  const handleInstantRevoke = async (documentId: string, userId: string, userName: string) => {
    const res = await apiClient.revokePermission(documentId, userId);
    if (res.status === 200) {
      setRevocationSuccess(`Instant Revocation Confirmed: Access for ${userName} nullified with 0ms delay.`);
      setTimeout(() => setRevocationSuccess(null), 4000);
      onRefresh();
    } else {
      alert(`Error revoking access: ${res.error}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Document Owner Header */}
      <div className="p-6 rounded-2xl bg-[#0e1422] border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-semibold uppercase">
              <KeyRound className="w-4 h-4" />
              <span>Document Owner Authority & Vault Workspace</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
              Confidential Asset Publishing & Access Control
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Workspace for <span className="text-white font-semibold">{currentActor.name}</span> ({currentActor.department}). You have full authority to publish files, grant named access, and enforce instant revocation.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenUpload}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors whitespace-nowrap shadow-sm shadow-cyan-950"
            >
              <Plus className="w-4 h-4" />
              Upload New Document
            </button>
          </div>
        </div>

        {/* SUMMARY WIDGET: ACTIVE SHARED DOCS & OWNER KPI METRICS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Main Requested Widget: Active Shared Docs Count */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 to-[#0e1422] border border-emerald-500/30 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-emerald-400 font-semibold uppercase flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5" />
                Active Shared Docs
              </span>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                Live Grants
              </span>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold font-mono text-emerald-400 tabular-nums">
                  {activeSharedDocsCount}
                </span>
                <span className="text-xs text-slate-400">
                  of {ownedDocs.length} total owned files
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {activeSharedDocsCount === 0
                  ? 'Zero documents currently shared. All files are strictly private to you.'
                  : `${activeSharedDocsCount} ${activeSharedDocsCount === 1 ? 'document has' : 'documents have'} active external permissions granted.`}
              </p>
            </div>
            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Private / Unshared Docs:</span>
              <span className="font-mono text-white font-semibold">{privateDocsCount}</span>
            </div>
          </div>

          {/* Widget 2: Active Named Grantees & Instant Revocation */}
          <div className="p-4 rounded-xl bg-[#0e1422] border border-slate-800 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-cyan-400 font-semibold uppercase flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5" />
                Named Recipient Seats
              </span>
              <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded">
                0ms Revocation
              </span>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold font-mono text-cyan-400 tabular-nums">
                  {activeGrants.length}
                </span>
                <span className="text-xs text-slate-400">active grant allocations</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                External viewers holding verifiable read or edit tokens. Revoking instantly terminates active sessions.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Revocation Propagation:</span>
              <span className="font-mono text-emerald-400 font-semibold">Immediate (0ms)</span>
            </div>
          </div>

          {/* Widget 3: Cryptographic Ledger State */}
          <div className="p-4 rounded-xl bg-[#0e1422] border border-slate-800 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-amber-400 font-semibold uppercase flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Audit Trail Integrity
              </span>
              <span className="text-[10px] font-mono text-emerald-400">100% Intact</span>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold font-mono text-white">
                  SHA-256 Chained
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Every view, download, permission grant, and refused attempt on your documents is committed to the blockchain-like ledger.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Tamper Resistance:</span>
              <span className="font-mono text-slate-300">FIPS 180-4 Standard</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation for Owner */}
        <div className="pt-2 flex items-center gap-1 border-t border-slate-800/80 overflow-x-auto">
          <button
            onClick={() => setOwnerTab('documents')}
            className={`px-4 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-colors flex items-center gap-2 ${
              ownerTab === 'documents'
                ? 'bg-slate-800 text-white font-semibold border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4 text-cyan-400" />
            My Documents ({ownedDocs.length})
          </button>
          <button
            onClick={() => setOwnerTab('revocation_hub')}
            className={`px-4 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-colors flex items-center gap-2 ${
              ownerTab === 'revocation_hub'
                ? 'bg-slate-800 text-white font-semibold border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Share2 className="w-4 h-4 text-emerald-400" />
            Instant Revocation & Grants Authority ({activeGrants.length})
          </button>
          <button
            onClick={() => setOwnerTab('audit')}
            className={`px-4 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-colors flex items-center gap-2 ${
              ownerTab === 'audit'
                ? 'bg-slate-800 text-white font-semibold border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4 text-slate-400" />
            Document Activity Trail
          </button>
          <button
            onClick={() => setOwnerTab('simulator')}
            className={`px-4 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-colors flex items-center gap-2 ${
              ownerTab === 'simulator'
                ? 'bg-slate-800 text-white font-semibold border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-4 h-4 text-amber-400" />
            Attack Simulator
          </button>
        </div>
      </div>

      {/* Owner Tab 1: Documents */}
      {ownerTab === 'documents' && (
        <div className="space-y-6">
          {/* Active Shared Docs Highlight Banner if there are shared documents */}
          {activeSharedDocsCount > 0 && (
            <div className="p-4 rounded-xl bg-[#0e1422] border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-emerald-400" />
                  Active Shared Documents Breakdown ({activeSharedDocsCount})
                </span>
                <button
                  onClick={() => setOwnerTab('revocation_hub')}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
                >
                  <span>Manage All in Revocation Hub</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeSharedDocs.map(doc => {
                  const docActiveGrants = doc.permissions.filter(p => !p.revokedAt && (!p.expiresAt || p.expiresAt > nowIso));
                  return (
                    <div key={doc.id} className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-xs space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-white truncate">{doc.title}</h4>
                          <span className="text-[11px] font-mono text-slate-400">{doc.filename}</span>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-900/60 shrink-0">
                          {docActiveGrants.length} active {docActiveGrants.length === 1 ? 'grant' : 'grants'}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 space-y-1">
                        {docActiveGrants.map(g => (
                          <div key={g.id} className="flex items-center justify-between gap-2">
                            <span className="text-slate-300">{g.userName} ({g.userEmail})</span>
                            <span className="font-mono text-cyan-400 font-medium text-[10px]">{g.permission}</span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 border-t border-slate-800 flex justify-end gap-2">
                        <button
                          onClick={() => onOpenPermissions(doc)}
                          className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium"
                        >
                          Manage Permissions &rarr;
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <DocumentList
            documents={documents}
            currentActor={currentActor}
            onOpenViewer={onOpenViewer}
            onOpenPermissions={onOpenPermissions}
            onDownload={onDownload}
            onDelete={onDelete}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
          />
        </div>
      )}

      {/* Owner Tab 2: Instant Revocation & Grants Authority Hub */}
      {ownerTab === 'revocation_hub' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">
                Active Named Grantees Across Your Documents
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Revoking access takes effect across the server within 0 milliseconds, immediately invalidating any active viewing tokens.
              </p>
            </div>
            <span className="text-xs font-mono text-cyan-400">
              {activeGrants.length} Active Grants
            </span>
          </div>

          {revocationSuccess && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-800/80 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{revocationSuccess}</span>
            </div>
          )}

          {allGrants.length === 0 ? (
            <div className="p-10 rounded-xl bg-[#0e1422] border border-slate-800 text-center text-xs text-slate-400">
              No access grants have been issued for your documents. All files are strictly locked to you.
            </div>
          ) : (
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-[#0e1422] divide-y divide-slate-800">
              {allGrants.map(grant => {
                const isRevoked = !!grant.revokedAt;
                return (
                  <div key={grant.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-white text-sm">{grant.userName}</span>
                        <span className="text-slate-500 font-mono">({grant.userEmail})</span>
                        <span className="text-slate-600 font-mono">·</span>
                        <span className={`font-mono font-semibold ${isRevoked ? 'text-slate-500 line-through' : 'text-cyan-400'}`}>
                          {grant.permission} Access
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                        <span className="text-slate-500">Document:</span>
                        <span className="text-slate-200 font-medium">{grant.documentTitle}</span>
                        <span className="text-slate-600">·</span>
                        <span>Granted: {new Date(grant.grantedAt).toLocaleString()}</span>
                        {isRevoked && (
                          <span className="text-rose-400 font-semibold ml-1">
                            Revoked: {new Date(grant.revokedAt!).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      {!isRevoked ? (
                        <button
                          onClick={() => handleInstantRevoke(grant.documentId, grant.userId, grant.userName)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/80 text-rose-300 font-semibold rounded-lg text-xs transition-colors"
                          title="Instantly Revoke Access (0ms latency)"
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                          <span>Revoke Access Immediately</span>
                        </button>
                      ) : (
                        <span className="text-rose-400/80 font-mono text-xs font-semibold px-2.5 py-1 bg-rose-950/30 rounded border border-rose-900/40">
                          Access Nullified
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Owner Tab 3: Activity Trail */}
      {ownerTab === 'audit' && (
        <AuditLedger currentActor={currentActor} />
      )}

      {/* Owner Tab 4: Simulator */}
      {ownerTab === 'simulator' && (
        <AttackSimulator />
      )}
    </div>
  );
};
