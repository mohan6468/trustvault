/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AttackSimulationResult } from '../types';
import { apiClient } from '../services/apiClient';
import { 
  Terminal, 
  Play, 
  CheckCircle2, 
  XCircle, 
  ShieldAlert, 
  RefreshCw, 
  Lock, 
  Bug, 
  ExternalLink 
} from 'lucide-react';

interface ScenarioDef {
  id: string;
  title: string;
  attacker: string;
  target: string;
  vector: string;
  threatRef: string;
  description: string;
}

const SCENARIOS: ScenarioDef[] = [
  {
    id: 'idor_unassigned_download',
    title: 'IDOR Prevention: Untrusted Direct Download Attempt',
    attacker: 'Eve Malicious (Untrusted Foreign Actor)',
    target: 'Executive Compensation & 2026 Bonus Matrix (doc_exec_comp_2026)',
    vector: 'GET /api/documents/doc_exec_comp_2026/download [X-Actor-Id: usr_intruder_eve]',
    threatRef: 'THREATS.md: Threat 01 (IDOR)',
    description: 'Untrusted external actor guesses or enumerates a restricted document ID and initiates a direct binary file download.'
  },
  {
    id: 'unauthorized_viewer_idor',
    title: 'Horizontal Boundary Enforcement: Viewer Snoops Unassigned Document',
    attacker: 'Charlie Lin (SOC-2 Auditor)',
    target: 'Executive Compensation & 2026 Bonus Matrix (doc_exec_comp_2026)',
    vector: 'GET /api/documents/doc_exec_comp_2026/read [X-Actor-Id: usr_viewer_charlie]',
    threatRef: 'THREATS.md: Threat 01 (Horizontal Privilege Escalation)',
    description: 'An authenticated auditor granted access to SOC-2 attempts to view unassigned corporate salary records.'
  },
  {
    id: 'instant_revocation_test',
    title: 'Instant Revocation: Access Nullified with 0ms Delay',
    attacker: 'Charlie Lin (Auditor whose grant was just revoked)',
    target: 'Q3 SOC-2 Type II Independent Audit Evidence Package',
    vector: 'DELETE /permissions -> 0ms -> GET /read [X-Actor-Id: usr_viewer_charlie]',
    threatRef: 'THREATS.md: Threat 02 (Stale Token & Lingering Access Gap)',
    description: 'Alice Vance revokes Charlie Lin\'s permission. Charlie attempts to read the file 0 milliseconds later. The server immediately returns 403 Forbidden with zero cache latency.'
  },
  {
    id: 'admin_zero_trust_payload',
    title: 'Separation of Duties: Admin Payload Snooping Prevention',
    attacker: 'Sarah Chen (Global Security Administrator)',
    target: 'Project Titan M&A Term Sheet ($48.5M Acquisition)',
    vector: 'GET /api/documents/doc_acquisition_titan/read [X-Actor-Id: usr_admin_01]',
    threatRef: 'THREATS.md: Threat 04 (Rogue Administrator / Insider Threat)',
    description: 'An administrator with platform oversight attempts to inspect confidential acquisition contracts. Under Zero-Trust Separation of Duties, admins are locked out of private payloads without an explicit grant.'
  },
  {
    id: 'malicious_executable_upload',
    title: 'Upload Hardening: High-Risk Executable Blocked',
    attacker: 'David Miller (Engineer)',
    target: 'Upload Gateway (invoice_patch.exe)',
    vector: 'POST /api/documents { filename: "invoice_patch.exe", content: "MZ9000..." }',
    threatRef: 'THREATS.md: Threat 05 (Malicious Executables & Polyglots)',
    description: 'Attacker uploads an executable disguised as an invoice. The upload firewall identifies high-risk extension and blocks the ingestion.'
  },
  {
    id: 'path_traversal_attack',
    title: 'Path Traversal Prevention: Directory Escape Sanitization',
    attacker: 'David Miller (Engineer)',
    target: 'Host Server File System (/etc/shadow)',
    vector: 'POST /api/documents { filename: "../../../../etc/shadow.txt" }',
    threatRef: 'THREATS.md: Threat 06 (Directory Traversal)',
    description: 'Attacker specifies path traversal characters (../) to escape storage bounds. The server sanitizes the path and prevents arbitrary file manipulation.'
  }
];

export const AttackSimulator: React.FC = () => {
  const [results, setResults] = useState<Record<string, AttackSimulationResult>>({});
  const [runningId, setRunningId] = useState<string | null>(null);

  const handleRunAttack = async (scenario: ScenarioDef) => {
    setRunningId(scenario.id);
    const res = await apiClient.runPenetrationTest(scenario.id);
    setResults(prev => ({
      ...prev,
      [scenario.id]: res
    }));
    setRunningId(null);
  };

  const handleRunAll = async () => {
    for (const scenario of SCENARIOS) {
      setRunningId(scenario.id);
      const res = await apiClient.runPenetrationTest(scenario.id);
      setResults(prev => ({
        ...prev,
        [scenario.id]: res
      }));
    }
    setRunningId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-xl bg-[#0e1422] border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Terminal className="w-5 h-5 text-cyan-400" />
              Interactive Security Penetration Lab
            </h2>
            <span className="text-xs font-mono text-cyan-400">AUDITOR TESTING SUITE</span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Simulate real attack vectors against TrustVault's server-side security engine. Verify that the server rejects unauthorized requests, enforces instant revocation, and permanently commits every attempt to the cryptographic ledger.
          </p>
        </div>

        <div>
          <button
            onClick={handleRunAll}
            disabled={runningId !== null}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg transition-colors whitespace-nowrap shadow-sm shadow-cyan-950"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Execute All 6 Attack Scenarios</span>
          </button>
        </div>
      </div>

      {/* Scenarios Grid */}
      <div className="space-y-4">
        {SCENARIOS.map((sc, index) => {
          const res = results[sc.id];
          const isRunning = runningId === sc.id;

          return (
            <div 
              key={sc.id}
              className="p-5 rounded-xl bg-[#0e1422] border border-slate-800 hover:border-slate-700/80 transition-colors space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="font-mono text-xs text-slate-500 mt-0.5">#{index + 1}</span>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{sc.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 flex-wrap">
                      <span className="text-rose-400 font-mono">Attacker: {sc.attacker}</span>
                      <span className="text-slate-600">·</span>
                      <span className="text-cyan-400 font-mono">{sc.threatRef}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {res && (
                    <div className="flex items-center gap-1.5 text-xs font-mono">
                      {res.passed ? (
                        <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                          <CheckCircle2 className="w-4 h-4" />
                          ATTACK BLOCKED (HTTP {res.httpStatus})
                        </span>
                      ) : (
                        <span className="text-rose-400 flex items-center gap-1 font-semibold">
                          <XCircle className="w-4 h-4" />
                          FAILED
                        </span>
                      )}
                    </div>
                  )}

                  <button
                    onClick={() => handleRunAttack(sc)}
                    disabled={isRunning}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
                  >
                    <Play className={`w-3.5 h-3.5 text-cyan-400 ${isRunning ? 'animate-spin' : ''}`} />
                    <span>{isRunning ? 'Probing...' : 'Run Attack'}</span>
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-400">
                {sc.description}
              </p>

              {/* Vector payload snippet */}
              <div className="p-2.5 rounded bg-[#070a12] border border-slate-800/80 font-mono text-[11px] text-slate-300">
                <span className="text-slate-500">Target Request: </span>
                <span className="text-cyan-300">{sc.vector}</span>
              </div>

              {/* Live Output & Resulting Forensic Audit Block */}
              {res && (
                <div className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Server Evaluation Rationale:</span>
                    <span className="text-emerald-400 font-semibold">{res.serverDecision}</span>
                  </div>

                  {res.auditEventCreated && (
                    <div className="p-2 rounded bg-black/40 border border-slate-800 font-mono text-[10px] text-slate-400 space-y-0.5">
                      <div className="text-cyan-400 font-semibold">
                        Forensic Proof Committed to SHA-256 Ledger:
                      </div>
                      <div>
                        Event #{res.auditEventCreated.index} [{res.auditEventCreated.status}] · {res.auditEventCreated.action} by {res.auditEventCreated.actorEmail} ({res.auditEventCreated.actorIp})
                      </div>
                      <div className="truncate">
                        Hash: {res.auditEventCreated.hash} · Linked Prev: {res.auditEventCreated.previousHash.slice(0, 16)}...
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
