/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, VaultDocument, AuditEvent } from '../types';
import { AuditLedger } from './AuditLedger';
import { AttackSimulator } from './AttackSimulator';
import { DocsViewer } from './DocsViewer';
import { apiClient } from '../services/apiClient';
import { ChainVerificationResult } from '../security/cryptoChain';
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck,
  Lock, 
  FileText, 
  CheckCircle2, 
  Terminal, 
  History, 
  AlertTriangle, 
  BookOpen, 
  Database,
  RefreshCw,
  Activity,
  Zap,
  Clock,
  Server
} from 'lucide-react';

interface AdminDashboardProps {
  currentActor: User;
  allDocuments: VaultDocument[];
  onOpenViewer: (doc: VaultDocument) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentActor,
  allDocuments,
  onOpenViewer
}) => {
  const [adminTab, setAdminTab] = useState<'audit' | 'inventory' | 'simulator' | 'docs'>('audit');
  const [verification, setVerification] = useState<ChainVerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [events, setEvents] = useState<AuditEvent[]>([]);

  const loadSecurityState = async () => {
    setIsVerifying(true);
    const check = await apiClient.verifyAuditTrail();
    setVerification(check);
    const trail = await apiClient.getAuditTrail();
    if (trail.status === 200 && trail.events) {
      setEvents(trail.events);
    }
    setIsVerifying(false);
  };

  useEffect(() => {
    loadSecurityState();
  }, [currentActor.id]);

  const deniedEvents = events.filter(e => e.status === 'DENIED');
  const latestDenied = deniedEvents[deniedEvents.length - 1];

  return (
    <div className="space-y-6">
      {/* Admin Executive Header */}
      <div className="p-6 rounded-2xl bg-[#0e1422] border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-amber-400 font-semibold uppercase">
              <Shield className="w-4 h-4" />
              <span>Administrative Security & Governance Console</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
              Global Security Operations & Audit Ledger
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Platform governance interface for <span className="text-white font-semibold">{currentActor.name}</span> ({currentActor.department}). Full oversight of cryptographic hash chains, forensic audit trails, and access anomalies.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Enforced Policy:</span>
              <span className="font-semibold text-emerald-400">Zero-Trust Separation of Duties</span>
            </div>
          </div>
        </div>

        {/* SUMMARY WIDGET: SYSTEM SECURITY HEALTH ALERTS */}
        <div className="p-5 rounded-xl bg-slate-900/90 border border-amber-500/30 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-950/70 border border-amber-700/60 flex items-center justify-center text-amber-400">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  System Security Health Alerts
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                    verification?.valid 
                      ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800/80' 
                      : 'text-rose-400 bg-rose-950/80 border-rose-800'
                  }`}>
                    {verification?.valid ? '100% HEALTHY' : 'CRITICAL TAMPER ALERT'}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time threat diagnostics, cryptographic ledger verification, and boundary refusal monitoring.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={loadSecurityState}
                disabled={isVerifying}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
                title="Recalculate cryptographic hash verification"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isVerifying ? 'animate-spin' : ''}`} />
                <span>Run Health Scan</span>
              </button>
            </div>
          </div>

          {/* Health Alert Indicators Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Alert Card 1: Cryptographic Integrity */}
            <div className="p-3.5 rounded-lg bg-[#0e1422] border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400 uppercase">Cryptographic Ledger</span>
                {verification?.valid ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                )}
              </div>
              <div className="font-bold text-white font-mono text-sm">
                {verification?.valid ? 'Chain Verified' : 'Tamper Detected'}
              </div>
              <p className="text-[11px] text-slate-400">
                {verification?.verifiedBlocks || 0} blocks intact from Genesis #0. Zero history alterations.
              </p>
            </div>

            {/* Alert Card 2: Refused Probes & IDOR Anomalies */}
            <div className={`p-3.5 rounded-lg border space-y-1.5 ${
              deniedEvents.length > 0
                ? 'bg-rose-950/20 border-rose-900/60'
                : 'bg-[#0e1422] border-slate-800'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400 uppercase">Refused Probes Caught</span>
                <span className="text-rose-400 font-mono font-bold">{deniedEvents.length}</span>
              </div>
              <div className="font-bold text-white font-mono text-sm">
                {deniedEvents.length} Refused Attempts
              </div>
              <p className="text-[11px] text-slate-400">
                {latestDenied 
                  ? `Latest: ${latestDenied.action} from ${latestDenied.actorIp}` 
                  : 'Zero unauthorized attempts detected.'}
              </p>
            </div>

            {/* Alert Card 3: Zero-Trust Separation of Duties */}
            <div className="p-3.5 rounded-lg bg-[#0e1422] border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400 uppercase">Separation of Duties</span>
                <Lock className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="font-bold text-white font-mono text-sm">
                Payload Isolated
              </div>
              <p className="text-[11px] text-slate-400">
                Admin payload lock active. Private documents unreachable without owner grant.
              </p>
            </div>

            {/* Alert Card 4: Upload Gateway Firewall */}
            <div className="p-3.5 rounded-lg bg-[#0e1422] border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400 uppercase">Upload Firewall</span>
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="font-bold text-white font-mono text-sm">
                Extension Whitelist
              </div>
              <p className="text-[11px] text-slate-400">
                High-risk extensions (.exe, .sh, .svg) blocked. Path traversal protection active.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation for Admin Console */}
        <div className="pt-2 flex items-center gap-1 border-t border-slate-800/80 overflow-x-auto">
          <button
            onClick={() => setAdminTab('audit')}
            className={`px-4 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-colors flex items-center gap-2 ${
              adminTab === 'audit'
                ? 'bg-slate-800 text-white font-semibold border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4 text-cyan-400" />
            Cryptographic Audit Ledger
          </button>
          <button
            onClick={() => setAdminTab('inventory')}
            className={`px-4 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-colors flex items-center gap-2 ${
              adminTab === 'inventory'
                ? 'bg-slate-800 text-white font-semibold border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4 text-emerald-400" />
            Document Governance Inventory ({allDocuments.length})
          </button>
          <button
            onClick={() => setAdminTab('simulator')}
            className={`px-4 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-colors flex items-center gap-2 ${
              adminTab === 'simulator'
                ? 'bg-slate-800 text-white font-semibold border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-4 h-4 text-amber-400" />
            Penetration Attack Lab
          </button>
          <button
            onClick={() => setAdminTab('docs')}
            className={`px-4 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-colors flex items-center gap-2 ${
              adminTab === 'docs'
                ? 'bg-slate-800 text-white font-semibold border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4 text-slate-400" />
            Threat Model & Specifications
          </button>
        </div>
      </div>

      {/* Main Admin Content */}
      {adminTab === 'audit' && (
        <AuditLedger currentActor={currentActor} />
      )}

      {adminTab === 'inventory' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">
              Global Document Inventory & Classification Metadata
            </h3>
            <span className="text-xs font-mono text-slate-400">
              {allDocuments.length} Total Registered Documents
            </span>
          </div>

          <div className="border border-slate-800 rounded-xl overflow-hidden bg-[#0e1422] divide-y divide-slate-800">
            {allDocuments.map(doc => {
              const activeGrants = doc.permissions.filter(p => !p.revokedAt).length;
              return (
                <div key={doc.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{doc.title}</span>
                      <span className="text-slate-500 font-mono">·</span>
                      <span className="text-xs font-mono text-cyan-400">{doc.classification}</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-400 mt-1 flex-wrap font-mono text-[11px]">
                      <span>{doc.filename}</span>
                      <span className="text-slate-600">·</span>
                      <span>Owner: {doc.ownerName}</span>
                      <span className="text-slate-600">·</span>
                      <span>{doc.category}</span>
                      <span className="text-slate-600">·</span>
                      <span>SHA-256: {doc.sha256Hash.slice(0, 12)}...</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-slate-400 font-mono text-[11px]">
                      {activeGrants} {activeGrants === 1 ? 'grant' : 'grants'}
                    </span>
                    <button
                      onClick={() => onOpenViewer(doc)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5"
                      title="Inspect Metadata & Audit Trail"
                    >
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Inspect Metadata</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {adminTab === 'simulator' && (
        <AttackSimulator />
      )}

      {adminTab === 'docs' && (
        <DocsViewer />
      )}
    </div>
  );
};
