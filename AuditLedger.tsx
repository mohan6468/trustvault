/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuditEvent, User } from '../types';
import { apiClient } from '../services/apiClient';
import { ChainVerificationResult } from '../security/cryptoChain';
import { 
  ShieldCheck, 
  ShieldAlert, 
  RefreshCw, 
  Download, 
  Filter, 
  Lock, 
  AlertTriangle, 
  CheckCircle2, 
  Zap, 
  Terminal 
} from 'lucide-react';

interface AuditLedgerProps {
  currentActor: User;
}

export const AuditLedger: React.FC<AuditLedgerProps> = ({ currentActor }) => {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ALLOWED' | 'DENIED'>('ALL');
  const [verification, setVerification] = useState<ChainVerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [tamperMode, setTamperMode] = useState(false);

  const loadAuditData = async () => {
    setLoading(true);
    const res = await apiClient.getAuditTrail();
    if (res.status === 200) {
      setEvents(res.events);
    }
    const check = await apiClient.verifyAuditTrail();
    setVerification(check);
    setLoading(false);
  };

  useEffect(() => {
    loadAuditData();
  }, [currentActor.id]);

  const handleVerifyChain = async () => {
    setIsVerifying(true);
    const check = await apiClient.verifyAuditTrail();
    setVerification(check);
    setIsVerifying(false);
  };

  const handleSimulateTamper = async () => {
    // Deliberately tamper with block #2 details in database
    const res = await apiClient.simulateTamperAttack(
      2,
      'STEALTH DB MODIFICATION: Rogue admin cleared records of unauthorized download'
    );
    setTamperMode(true);
    setVerification(res.verification);
    // Reload audit events to reflect the tampered state
    const trailRes = await apiClient.getAuditTrail();
    if (trailRes.status === 200) {
      setEvents(trailRes.events);
    }
  };

  const handleRestoreChain = async () => {
    await apiClient.restoreAuditTrail();
    setTamperMode(false);
    await loadAuditData();
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(events, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `trustvault_audit_chain_${Date.now()}.json`);
    dlAnchor.click();
  };

  const handleExportCSV = () => {
    const headers = ['Index', 'Timestamp', 'Action', 'ActorEmail', 'ActorRole', 'ActorIP', 'Document', 'Status', 'Details', 'Hash', 'PreviousHash'];
    const rows = events.map(e => [
      e.index,
      e.timestamp,
      e.action,
      `"${e.actorEmail}"`,
      e.actorRole,
      e.actorIp,
      `"${e.documentTitle || ''}"`,
      e.status,
      `"${e.details.replace(/"/g, '""')}"`,
      e.hash,
      e.previousHash
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', encodeURI(csvContent));
    dlAnchor.setAttribute('download', `trustvault_audit_chain_${Date.now()}.csv`);
    dlAnchor.click();
  };

  const filteredEvents = events.filter(e => {
    if (statusFilter === 'ALL') return true;
    return e.status === statusFilter;
  });

  const deniedCount = events.filter(e => e.status === 'DENIED').length;

  return (
    <div className="space-y-6">
      {currentActor.role === 'intruder' ? (
        <div className="p-8 rounded-xl bg-[#0e1422] border border-rose-900/60 text-center space-y-3">
          <ShieldAlert className="w-12 h-12 text-rose-400 mx-auto" />
          <h3 className="text-base font-bold text-rose-200">Audit Ledger Access Refused</h3>
          <p className="text-xs text-rose-300/80 max-w-md mx-auto">
            Untrusted external actors have zero clearance to inspect the cryptographic ledger. Switch to Sarah Chen (Administrator) or Alice Vance (Document Owner) via the Persona bar above.
          </p>
        </div>
      ) : (
        <>
          {/* Top Banner & Proof Verification Dashboard */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-xl bg-[#0e1422] border border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Cryptographic Audit Ledger</h2>
                <span className="text-xs font-mono text-cyan-400 font-semibold">
                  {currentActor.role === 'admin' ? 'GLOBAL ADMIN LEDGER' : 'OWNER SCOPED LEDGER'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                {currentActor.role === 'admin'
                  ? 'System-wide cryptographic audit trail. Every read, download, grant, revocation, and refused 403 attempt across the company is linked in a SHA-256 hash chain.'
                  : `Scoped audit ledger for ${currentActor.name}. Showing events for your owned documents and authorized sessions.`}
              </p>
            </div>

        {/* Verification & Tamper demonstration actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleVerifyChain}
            disabled={isVerifying}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg border border-slate-700 transition-colors"
            title="Recalculate SHA-256 Hashes Across Entire Chain"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isVerifying ? 'animate-spin' : ''}`} />
            <span>Verify Integrity</span>
          </button>

          {!tamperMode ? (
            <button
              onClick={handleSimulateTamper}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-medium rounded-lg border border-rose-800/60 transition-colors"
              title="Deliberately modify a database row to demonstrate cryptographic tamper catching"
            >
              <Zap className="w-3.5 h-3.5 text-rose-400" />
              <span>Simulate DB Tampering</span>
            </button>
          ) : (
            <button
              onClick={handleRestoreChain}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 text-xs font-medium rounded-lg border border-emerald-800/60 transition-colors"
              title="Restore chain to pristine cryptographic state"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Restore Pristine Ledger</span>
            </button>
          )}

          <div className="flex items-center gap-1">
            <button
              onClick={handleExportJSON}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 text-xs"
              title="Export JSON"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Verification Status Alert */}
      {verification && (
        <div>
          {verification.valid ? (
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
                <div>
                  <h4 className="font-semibold text-emerald-200">
                    Cryptographic Integrity Verified: Zero Tampering Detected
                  </h4>
                  <p className="text-emerald-300/80 mt-0.5">
                    All {verification.verifiedBlocks} consecutive blocks verified from Genesis block. Hashes and linkage unbroken.
                  </p>
                </div>
              </div>
              <div className="font-mono text-emerald-400 tabular-nums font-semibold hidden sm:block">
                100% INTACT
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-800 text-xs space-y-2">
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-6 h-6 text-rose-400 shrink-0" />
                <div>
                  <h4 className="font-semibold text-rose-200 text-sm">
                    CRITICAL FORENSIC ALERT: Database Alteration / Tampering Caught!
                  </h4>
                  <p className="text-rose-300/90 mt-0.5">
                    {verification.reason}
                  </p>
                </div>
              </div>

              {verification.expectedHash && (
                <div className="p-2.5 rounded bg-black/40 border border-rose-900/60 font-mono text-[11px] text-rose-300 space-y-1">
                  <div>Failed Block Index: #{verification.errorIndex}</div>
                  <div>Expected Canonical Hash: {verification.expectedHash}</div>
                  <div>Recorded Hash in Row: {verification.actualHash}</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Summary KPI Strip (Unboxed zero-pill text) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-[#0e1422] border border-slate-800 text-xs">
        <div>
          <span className="text-slate-500 block">Total Ledger Entries</span>
          <span className="text-lg font-bold font-mono text-white tabular-nums">{events.length}</span>
        </div>
        <div>
          <span className="text-slate-500 block">Genesis Root Block</span>
          <span className="text-xs font-bold font-mono text-cyan-400 truncate block">#0 (0000...0000)</span>
        </div>
        <div>
          <span className="text-slate-500 block">Refused 403 Attempts</span>
          <span className="text-lg font-bold font-mono text-rose-400 tabular-nums">{deniedCount}</span>
        </div>
        <div>
          <span className="text-slate-500 block">Chained Algorithm</span>
          <span className="text-xs font-bold font-mono text-slate-300">FIPS 180-4 SHA-256</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-[#0e1422] p-1 border border-slate-800 rounded-lg">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              statusFilter === 'ALL' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Events ({events.length})
          </button>
          <button
            onClick={() => setStatusFilter('ALLOWED')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              statusFilter === 'ALLOWED' ? 'bg-slate-800 text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Allowed ({events.length - deniedCount})
          </button>
          <button
            onClick={() => setStatusFilter('DENIED')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              statusFilter === 'DENIED' ? 'bg-slate-800 text-rose-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Refused / Denied ({deniedCount})
          </button>
        </div>

        <span className="text-xs text-slate-500 font-mono">
          Showing {filteredEvents.length} events
        </span>
      </div>

      {/* Audit Log Table */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-[#0e1422] divide-y divide-slate-800/80 font-mono text-xs">
        {filteredEvents.map(evt => {
          const isDenied = evt.status === 'DENIED';
          return (
            <div key={evt.id} className="p-4 hover:bg-slate-800/30 transition-colors space-y-1.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-slate-500">#{evt.index}</span>
                  <span className={`font-semibold ${isDenied ? 'text-rose-400' : 'text-cyan-400'}`}>
                    {evt.action}
                  </span>
                  <span className="text-slate-600">·</span>
                  <span className="text-white font-sans font-medium">{evt.actorName}</span>
                  <span className="text-slate-500">({evt.actorEmail})</span>
                  <span className="text-slate-600">·</span>
                  <span className="text-slate-400">{evt.actorIp}</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                    isDenied ? 'bg-rose-950/60 text-rose-300 border border-rose-800/60' : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                  }`}>
                    {evt.status}
                  </span>
                  <span className="text-slate-500 text-[11px] tabular-nums">
                    {new Date(evt.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>

              {evt.documentTitle && (
                <div className="text-slate-400 text-[11px] flex items-center gap-2">
                  <span className="text-slate-500">Document:</span>
                  <span className="text-slate-300 font-sans">{evt.documentTitle}</span>
                  <span className="text-slate-600">·</span>
                  <span className="text-slate-500">Target ID: {evt.documentId}</span>
                </div>
              )}

              <p className="text-slate-300 text-[11px] font-sans">
                {evt.details}
              </p>

              {/* Cryptographic Linkage Details */}
              <div className="pt-1 text-[10px] text-slate-500 flex flex-col md:flex-row md:items-center justify-between gap-1 border-t border-slate-800/40">
                <span className="truncate">Block SHA-256: <span className="text-slate-400">{evt.hash}</span></span>
                <span className="truncate">Previous Block: <span className="text-slate-400">{evt.previousHash.slice(0, 20)}...</span></span>
              </div>
            </div>
          );
        })}
      </div>
      </>
      )}
    </div>
  );
};
