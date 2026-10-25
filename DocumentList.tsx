/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { VaultDocument, User, DocumentCategory } from '../types';
import { 
  Search, 
  FileText, 
  FileSpreadsheet, 
  Lock, 
  Eye, 
  Share2, 
  Download, 
  Trash2, 
  ShieldAlert, 
  CheckCircle2, 
  User as UserIcon, 
  Clock, 
  HardDrive 
} from 'lucide-react';

interface DocumentListProps {
  documents: VaultDocument[];
  currentActor: User;
  onOpenViewer: (doc: VaultDocument) => void;
  onOpenPermissions: (doc: VaultDocument) => void;
  onDownload: (doc: VaultDocument) => void;
  onDelete: (doc: VaultDocument) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string;
  setSelectedCategory: (c: string) => void;
}

const CATEGORIES: ('All' | DocumentCategory)[] = [
  'All',
  'Compliance & Audit',
  'Legal & Contracts',
  'Human Resources',
  'Finance & Equity',
  'Executive & Board'
];

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  currentActor,
  onOpenViewer,
  onOpenPermissions,
  onDownload,
  onDelete,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory
}) => {
  const getFileIcon = (filename: string) => {
    if (filename.endsWith('.xlsx') || filename.endsWith('.csv')) {
      return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
    }
    return <FileText className="w-5 h-5 text-cyan-400" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(0)} KB`;
  };

  return (
    <div className="space-y-6">
      {/* Header & Metric Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">Confidential Document Vault</h1>
          <p className="text-xs text-slate-400 mt-1">
            Zero-trust repository. All reads and downloads are verified live by the server and permanently hashed.
          </p>
        </div>

        {/* Quiet status metrics */}
        <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
          <div>
            <span className="text-slate-500">Accessible Files: </span>
            <span className="text-white font-semibold tabular-nums">{documents.length}</span>
          </div>
          <span className="text-slate-700">|</span>
          <div>
            <span className="text-slate-500">Actor Clearance: </span>
            <span className="text-cyan-400 font-semibold">{currentActor.role.toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* Search and Category Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, filename, owner, or tag..."
            className="w-full bg-[#0e1422] border border-slate-800 text-sm text-slate-200 pl-10 pr-4 py-2 rounded-lg placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
          />
        </div>

        {/* Category Filter Tabs (Interactive filter controls, allowed by constitution) */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0 scrollbar-none bg-[#0e1422] p-1 border border-slate-800/80 rounded-lg">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-slate-800 text-cyan-300 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Intruder warning if user is intruder */}
      {currentActor.role === 'intruder' && (
        <div className="p-4 rounded-lg bg-rose-950/30 border border-rose-900/60 text-xs text-rose-300 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-rose-200">Zero-Trust Boundary Enforced</p>
            <p className="mt-0.5 text-rose-300/80">
              You are signed in as an untrusted external actor (Eve Malicious). Zero documents are exposed in directory listings. Attempting to query documents by ID directly will return HTTP 403 Forbidden and record an access denial event in the immutable audit ledger.
            </p>
          </div>
        </div>
      )}

      {/* Documents Grid / Table */}
      {documents.length === 0 ? (
        <div className="text-center py-16 bg-[#0e1422] border border-slate-800/60 rounded-xl p-8">
          <Lock className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-300">No Documents Visible</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            {currentActor.role === 'intruder'
              ? 'External intruders possess zero access grants.'
              : 'No documents match your query or clearance level.'}
          </p>
        </div>
      ) : (
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-[#0e1422]/70 divide-y divide-slate-800/80">
          {documents.map((doc) => {
            const isOwner = doc.ownerId === currentActor.id;
            const activeGrant = doc.permissions.find(p => p.userId === currentActor.id && !p.revokedAt);
            const activeGrantsCount = doc.permissions.filter(p => !p.revokedAt).length;

            return (
              <div 
                key={doc.id}
                className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-850/30 transition-colors"
              >
                {/* File info */}
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 shrink-0 mt-0.5">
                    {getFileIcon(doc.filename)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-white truncate max-w-xl">
                        {doc.title}
                      </h3>
                      {/* Zero-Pill metadata: unboxed text with subtle typographic separators */}
                      <span className="text-xs text-slate-500 font-mono">
                        {doc.classification}
                      </span>
                    </div>

                    {/* Unboxed metadata row with typographic separators */}
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-1.5 flex-wrap">
                      <span className="font-mono text-slate-300">{doc.filename}</span>
                      <span className="text-slate-600">·</span>
                      <span>{doc.category}</span>
                      <span className="text-slate-600">·</span>
                      <span>Owner: {doc.ownerName}</span>
                      <span className="text-slate-600">·</span>
                      <span className="tabular-nums font-mono">{formatFileSize(doc.fileSize)}</span>
                      <span className="text-slate-600">·</span>
                      <span className="tabular-nums font-mono text-slate-500">
                        SHA-256: {doc.sha256Hash.slice(0, 10)}...
                      </span>
                    </div>

                    {/* Clearance / Grant status */}
                    <div className="flex items-center gap-2 mt-2 text-xs">
                      {isOwner ? (
                        <span className="text-emerald-400 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Document Owner ({activeGrantsCount} active {activeGrantsCount === 1 ? 'grant' : 'grants'})
                        </span>
                      ) : activeGrant ? (
                        <span className="text-cyan-400 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Authorized Grantee ({activeGrant.permission} Permission)
                        </span>
                      ) : currentActor.role === 'admin' ? (
                        <span className="text-amber-400/90 font-medium flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5" />
                          Admin Audit Clearance (Payload Locked)
                        </span>
                      ) : (
                        <span className="text-slate-500 font-medium flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5" />
                          Restricted Access
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions row */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <button
                    onClick={() => onOpenViewer(doc)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700/60"
                    title="Open Secure Watermarked Viewer"
                  >
                    <Eye className="w-3.5 h-3.5 text-cyan-400" />
                    <span>View Securely</span>
                  </button>

                  {isOwner && (
                    <button
                      onClick={() => onOpenPermissions(doc)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700/60"
                      title="Manage Named User Access Grants"
                    >
                      <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Permissions</span>
                    </button>
                  )}

                  <button
                    onClick={() => onDownload(doc)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-lg transition-colors border border-slate-700/40"
                    title="Download Binary Stream"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-400" />
                    <span>Download</span>
                  </button>

                  {isOwner && (
                    <button
                      onClick={() => onDelete(doc)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors"
                      title="Delete Document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
