/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { VaultDocument, User, PermissionGrant, AuditEvent } from '../types';
import { apiClient } from '../services/apiClient';
import { 
  X, 
  ShieldCheck, 
  Download, 
  Share2, 
  History, 
  Link, 
  Copy, 
  Check, 
  AlertCircle, 
  ShieldAlert, 
  UserMinus, 
  Clock, 
  Lock 
} from 'lucide-react';

interface DocumentViewerModalProps {
  document: VaultDocument;
  currentActor: User;
  allUsers: User[];
  onClose: () => void;
  onRefreshDocs: () => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  document: initialDoc,
  currentActor,
  allUsers,
  onClose,
  onRefreshDocs
}) => {
  const [doc, setDoc] = useState<VaultDocument>(initialDoc);
  const [activeTab, setActiveTab] = useState<'content' | 'permissions' | 'audit' | 'ephemeral'>('content');
  const [readState, setReadState] = useState<{
    loading: boolean;
    content?: string;
    watermarkText?: string;
    error?: string;
    status?: number;
  }>({ loading: true });

  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [copiedHash, setCopiedHash] = useState(false);

  // Ephemeral link state
  const [ephemeralToken, setEphemeralToken] = useState<string | null>(null);
  const [ephemeralSecondsLeft, setEphemeralSecondsLeft] = useState<number>(0);

  // New grant form
  const [selectedUserId, setSelectedUserId] = useState(allUsers[3]?.id || '');
  const [permissionLevel, setPermissionLevel] = useState<'READ' | 'EDIT'>('READ');
  const [expiryMinutes, setExpiryMinutes] = useState<string>('0');
  const [grantSuccessMsg, setGrantSuccessMsg] = useState<string | null>(null);

  const isOwner = doc.ownerId === currentActor.id;

  // Load document read payload
  useEffect(() => {
    let isMounted = true;
    async function loadContent() {
      setReadState({ loading: true });
      const res = await apiClient.readDocument(doc.id);
      if (isMounted) {
        if (res.status === 200 && res.content) {
          setReadState({
            loading: false,
            content: res.content,
            watermarkText: res.watermarkText,
            status: 200
          });
        } else {
          setReadState({
            loading: false,
            error: res.error || 'Access Denied: You lack permissions to view this payload.',
            status: res.status
          });
        }
      }
    }
    loadContent();
    return () => {
      isMounted = false;
    };
  }, [doc.id, currentActor.id]);

  // Load audit trail for this document
  useEffect(() => {
    async function loadAudit() {
      const res = await apiClient.getAuditTrail(doc.id);
      if (res.status === 200) {
        setAuditEvents(res.events);
      }
    }
    if (activeTab === 'audit') {
      loadAudit();
    }
  }, [activeTab, doc.id]);

  // Ephemeral timer countdown
  useEffect(() => {
    if (ephemeralSecondsLeft <= 0) return;
    const interval = setInterval(() => {
      setEphemeralSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setEphemeralToken(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [ephemeralSecondsLeft]);

  const handleCopyHash = () => {
    navigator.clipboard.writeText(doc.sha256Hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleGrantPermission = async (e: React.FormEvent) => {
    e.preventDefault();
    const exp = parseInt(expiryMinutes) > 0 ? parseInt(expiryMinutes) : undefined;
    const res = await apiClient.grantPermission(doc.id, selectedUserId, permissionLevel, exp);
    if (res.status === 200) {
      setGrantSuccessMsg(`Permission granted successfully.`);
      setTimeout(() => setGrantSuccessMsg(null), 3500);
      onRefreshDocs();
      // Reload current doc metadata
      const updatedDocs = await apiClient.getDocuments();
      const updated = updatedDocs.find(d => d.id === doc.id);
      if (updated) setDoc(updated);
    }
  };

  const handleRevokePermission = async (userId: string) => {
    const res = await apiClient.revokePermission(doc.id, userId);
    if (res.status === 200) {
      setGrantSuccessMsg(`Access revoked immediately. Active sessions and ephemeral tokens invalidated.`);
      setTimeout(() => setGrantSuccessMsg(null), 4000);
      onRefreshDocs();
      const updatedDocs = await apiClient.getDocuments();
      const updated = updatedDocs.find(d => d.id === doc.id);
      if (updated) setDoc(updated);
    }
  };

  const handleGenerateEphemeral = async () => {
    const res = await apiClient.generateEphemeralLink(doc.id, 60);
    if (res.status === 200 && res.token) {
      setEphemeralToken(res.token);
      setEphemeralSecondsLeft(60);
    }
  };

  const handleDownload = async () => {
    const res = await apiClient.downloadDocument(doc.id);
    if (res.status === 200 && res.content) {
      const blob = new Blob([res.content], { type: res.mimeType || 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = res.filename || doc.filename;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      alert(`Download Refused: ${res.error}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div 
        className="bg-[#0b0f19] border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between gap-4 bg-[#0e1422]">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-mono text-cyan-400 font-semibold">{doc.classification}</span>
              <span className="text-slate-600 font-mono">·</span>
              <span className="text-xs text-slate-400">{doc.category}</span>
            </div>
            <h2 className="text-lg font-bold text-white truncate mt-0.5">{doc.title}</h2>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
              <span className="font-mono text-slate-300">{doc.filename}</span>
              <span className="text-slate-600">·</span>
              <button 
                onClick={handleCopyHash}
                className="font-mono text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors"
                title="Copy SHA-256 Checksum"
              >
                <span>SHA-256: {doc.sha256Hash.slice(0, 12)}...</span>
                {copiedHash ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
              title="Download Binary Stream"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Download</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Close Dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Nav Tabs (Segmented control) */}
        <div className="px-5 pt-3 border-b border-slate-800/80 bg-[#0e1422]/60 flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('content')}
            className={`pb-2.5 px-3 text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'content'
                ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Watermarked Viewer
          </button>

          {isOwner && (
            <button
              onClick={() => setActiveTab('permissions')}
              className={`pb-2.5 px-3 text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeTab === 'permissions'
                  ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Share2 className="w-4 h-4" />
              Access Grants ({doc.permissions.filter(p => !p.revokedAt).length})
            </button>
          )}

          <button
            onClick={() => setActiveTab('audit')}
            className={`pb-2.5 px-3 text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'audit'
                ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            Document Audit Trail
          </button>

          <button
            onClick={() => setActiveTab('ephemeral')}
            className={`pb-2.5 px-3 text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'ephemeral'
                ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Link className="w-4 h-4" />
            Ephemeral Link
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex-1 overflow-y-auto">
          {/* TAB 1: WATERMARKED CONTENT */}
          {activeTab === 'content' && (
            <div>
              {readState.loading ? (
                <div className="py-20 text-center text-xs text-slate-500 font-mono">
                  Executing server authorization handshake & verifying SHA-256 integrity...
                </div>
              ) : readState.error ? (
                <div className="p-6 rounded-xl bg-rose-950/30 border border-rose-900/60 text-center my-6">
                  <ShieldAlert className="w-10 h-10 text-rose-400 mx-auto mb-3" />
                  <h4 className="text-sm font-semibold text-rose-200">Zero-Trust Access Refused</h4>
                  <p className="text-xs text-rose-300/80 mt-1 max-w-md mx-auto">{readState.error}</p>
                  <p className="text-xs text-slate-500 mt-3 font-mono">
                    Attempt logged to immutable cryptographic ledger as ACCESS_DENIED.
                  </p>
                </div>
              ) : (
                <div className="relative rounded-xl border border-slate-800 bg-[#070a12] p-6 sm:p-8 font-mono text-xs text-slate-300 leading-relaxed overflow-hidden">
                  {/* DYNAMIC FORENSIC WATERMARK OVERLAY */}
                  <div className="absolute inset-0 watermark-overlay flex flex-col justify-around pointer-events-none select-none opacity-20 rotate-[-15deg] scale-125 z-10 text-center font-bold text-slate-400 text-sm tracking-wider">
                    <div>{readState.watermarkText}</div>
                    <div>{readState.watermarkText}</div>
                    <div>{readState.watermarkText}</div>
                    <div>{readState.watermarkText}</div>
                  </div>

                  {/* Document Raw Content */}
                  <div className="relative z-0 whitespace-pre-wrap selection:bg-cyan-500/30 selection:text-white">
                    {readState.content}
                  </div>

                  {/* Forensic footer marker */}
                  <div className="mt-8 pt-4 border-t border-slate-800/80 text-[11px] text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span>Forensic Session ID: {doc.id}·{currentActor.id}</span>
                    <span className="tabular-nums">Viewing IP: {currentActor.ipAddress}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ACCESS GRANTS & INSTANT REVOCATION */}
          {activeTab === 'permissions' && isOwner && (
            <div className="space-y-6">
              {grantSuccessMsg && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-800/80 text-emerald-300 text-xs rounded-lg flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{grantSuccessMsg}</span>
                </div>
              )}

              {/* Grant form */}
              <div className="p-4 rounded-xl bg-[#0e1422] border border-slate-800">
                <h4 className="text-xs font-semibold text-white tracking-wide uppercase mb-3">
                  Grant Access to Named Identity
                </h4>
                <form onSubmit={handleGrantPermission} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] text-slate-400 mb-1">Select User</label>
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-xs text-white rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500"
                    >
                      {allUsers
                        .filter(u => u.id !== doc.ownerId && u.role !== 'intruder')
                        .map(u => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.email}) - {u.role}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Permission</label>
                    <select
                      value={permissionLevel}
                      onChange={(e) => setPermissionLevel(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 text-xs text-white rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="READ">READ (View & Download)</option>
                      <option value="EDIT">EDIT (Modify Payload)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Expiration</label>
                    <select
                      value={expiryMinutes}
                      onChange={(e) => setExpiryMinutes(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-xs text-white rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="0">Permanent (Until Revoked)</option>
                      <option value="15">15 Minutes</option>
                      <option value="60">1 Hour</option>
                      <option value="1440">24 Hours</option>
                    </select>
                  </div>

                  <div className="sm:col-span-4 flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs rounded-lg transition-colors"
                    >
                      Grant Access
                    </button>
                  </div>
                </form>
              </div>

              {/* Active Grantees List */}
              <div>
                <h4 className="text-xs font-semibold text-slate-400 tracking-wide uppercase mb-3">
                  Current Named Grantees ({doc.permissions.length})
                </h4>

                {doc.permissions.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No external grants issued. Document is strictly private to owner.</p>
                ) : (
                  <div className="border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800 bg-[#0e1422]">
                    {doc.permissions.map(grant => {
                      const isRevoked = !!grant.revokedAt;
                      return (
                        <div key={grant.id} className="p-3.5 flex items-center justify-between gap-3 text-xs">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white">{grant.userName}</span>
                              <span className="text-slate-500 font-mono">({grant.userEmail})</span>
                              <span className="text-slate-600 font-mono">·</span>
                              <span className={`font-mono text-[11px] ${isRevoked ? 'text-slate-500 line-through' : 'text-cyan-400'}`}>
                                {grant.permission}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              Granted: {new Date(grant.grantedAt).toLocaleString()}
                              {grant.expiresAt && ` · Expires: ${new Date(grant.expiresAt).toLocaleTimeString()}`}
                              {isRevoked && (
                                <span className="text-rose-400 ml-2 font-semibold">
                                  Revoked on {new Date(grant.revokedAt!).toLocaleTimeString()} by {grant.revokedBy}
                                </span>
                              )}
                            </div>
                          </div>

                          <div>
                            {!isRevoked ? (
                              <button
                                onClick={() => handleRevokePermission(grant.userId)}
                                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 rounded-md transition-colors"
                                title="Instantly Revoke Access (0ms latency)"
                              >
                                <UserMinus className="w-3.5 h-3.5" />
                                <span>Revoke Access</span>
                              </button>
                            ) : (
                              <span className="text-[11px] font-mono text-rose-400/80">Revoked</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: DOCUMENT AUDIT TRAIL */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Showing immutable SHA-256 chained events for this document:
                </span>
                <span className="text-xs font-mono text-cyan-400">
                  {auditEvents.length} Recorded Events
                </span>
              </div>

              {auditEvents.length === 0 ? (
                <p className="text-xs text-slate-500">No events recorded for this document yet.</p>
              ) : (
                <div className="border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800 bg-[#0e1422] font-mono text-xs">
                  {auditEvents.map(evt => {
                    const isDenied = evt.status === 'DENIED';
                    return (
                      <div key={evt.id} className="p-3.5 hover:bg-slate-800/40 transition-colors">
                        <div className="flex items-baseline justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 text-[11px]">#{evt.index}</span>
                            <span className={`font-semibold ${isDenied ? 'text-rose-400' : 'text-cyan-300'}`}>
                              {evt.action}
                            </span>
                            <span className="text-slate-600">·</span>
                            <span className="text-slate-300">{evt.actorName}</span>
                            <span className="text-slate-500 text-[11px]">({evt.actorIp})</span>
                          </div>
                          <span className="text-[11px] text-slate-500 tabular-nums">
                            {new Date(evt.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 font-sans">
                          {evt.details}
                        </p>
                        <div className="text-[10px] text-slate-600 mt-1 truncate">
                          Hash: {evt.hash.slice(0, 24)}... · Prev: {evt.previousHash.slice(0, 16)}...
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: EPHEMERAL LINK GENERATOR */}
          {activeTab === 'ephemeral' && (
            <div className="p-6 rounded-xl bg-[#0e1422] border border-slate-800 space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-white">Time-Limited Ephemeral Link</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Generates an ephemeral, single-user read token that self-destructs after 60 seconds. If access is revoked by the owner before expiration, this token is immediately terminated.
                </p>
              </div>

              {ephemeralToken ? (
                <div className="p-4 rounded-lg bg-cyan-950/30 border border-cyan-800/60 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-cyan-300 font-semibold flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-cyan-400" />
                      Token Active (Self-Destructs in {ephemeralSecondsLeft}s)
                    </span>
                    <span className="font-mono text-cyan-400">{ephemeralSecondsLeft}s</span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-cyan-400 h-full transition-all duration-1000 ease-linear"
                      style={{ width: `${(ephemeralSecondsLeft / 60) * 100}%` }}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={`${window.location.origin}/view?token=${ephemeralToken}&doc=${doc.id}`}
                      className="flex-1 bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200 px-3 py-1.5 rounded-md focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/view?token=${ephemeralToken}&doc=${doc.id}`);
                        alert('Ephemeral link copied to clipboard!');
                      }}
                      className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs rounded-md transition-colors"
                    >
                      Copy Link
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <button
                    onClick={handleGenerateEphemeral}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs rounded-lg transition-colors border border-slate-700 flex items-center gap-2"
                  >
                    <Link className="w-4 h-4 text-cyan-400" />
                    Generate 60-Second Ephemeral Link
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
