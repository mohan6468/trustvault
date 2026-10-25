/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { VaultDocument, User, PermissionGrant } from '../types';
import { apiClient } from '../services/apiClient';
import { X, Share2, UserMinus, Check, ShieldCheck, Clock } from 'lucide-react';

interface PermissionsModalProps {
  document: VaultDocument;
  currentActor: User;
  allUsers: User[];
  onClose: () => void;
  onUpdate: () => void;
}

export const PermissionsModal: React.FC<PermissionsModalProps> = ({
  document: initialDoc,
  currentActor,
  allUsers,
  onClose,
  onUpdate
}) => {
  const [doc, setDoc] = useState<VaultDocument>(initialDoc);
  const [targetUserId, setTargetUserId] = useState(
    allUsers.find(u => u.id !== doc.ownerId && u.role !== 'intruder')?.id || ''
  );
  const [permission, setPermission] = useState<'READ' | 'EDIT'>('READ');
  const [expiryMinutes, setExpiryMinutes] = useState<string>('0');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    const exp = parseInt(expiryMinutes) > 0 ? parseInt(expiryMinutes) : undefined;
    const res = await apiClient.grantPermission(doc.id, targetUserId, permission, exp);
    if (res.status === 200) {
      setStatusMsg('Permission granted successfully.');
      setTimeout(() => setStatusMsg(null), 3500);
      onUpdate();
      const updatedDocs = await apiClient.getDocuments();
      const updated = updatedDocs.find(d => d.id === doc.id);
      if (updated) setDoc(updated);
    } else {
      alert(`Error: ${res.error}`);
    }
  };

  const handleRevoke = async (userId: string) => {
    const res = await apiClient.revokePermission(doc.id, userId);
    if (res.status === 200) {
      setStatusMsg('Access revoked immediately. All active sessions terminated.');
      setTimeout(() => setStatusMsg(null), 4000);
      onUpdate();
      const updatedDocs = await apiClient.getDocuments();
      const updated = updatedDocs.find(d => d.id === doc.id);
      if (updated) setDoc(updated);
    } else {
      alert(`Error: ${res.error}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div 
        className="bg-[#0b0f19] border border-slate-800 rounded-2xl w-full max-w-xl flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between gap-4 bg-[#0e1422]">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Share2 className="w-5 h-5 text-emerald-400" />
              Manage Document Permissions
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 truncate max-w-md">
              {doc.title} ({doc.filename})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {statusMsg && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-800/80 text-emerald-300 text-xs rounded-lg flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{statusMsg}</span>
            </div>
          )}

          {/* Grant form */}
          <form onSubmit={handleGrant} className="p-4 rounded-xl bg-[#0e1422] border border-slate-800 space-y-3">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
              Grant Access to Named User
            </h4>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">User Identity</label>
              <select
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Permission Level</label>
                <select
                  value={permission}
                  onChange={(e) => setPermission(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 text-xs text-white rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500"
                >
                  <option value="READ">READ (View & Download)</option>
                  <option value="EDIT">EDIT (Modify Payload)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Grant Duration</label>
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
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs rounded-lg transition-colors"
              >
                Grant Access
              </button>
            </div>
          </form>

          {/* Grantees list */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
              Active Named Grantees ({doc.permissions.filter(p => !p.revokedAt).length})
            </h4>

            {doc.permissions.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-4 text-center bg-[#0e1422] rounded-xl border border-slate-800">
                No users have been granted access. This file is private to the Document Owner.
              </p>
            ) : (
              <div className="border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800 bg-[#0e1422]">
                {doc.permissions.map(g => {
                  const isRevoked = !!g.revokedAt;
                  return (
                    <div key={g.id} className="p-3.5 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{g.userName}</span>
                          <span className="text-slate-500 font-mono text-[11px]">({g.userEmail})</span>
                          <span className="text-slate-600">·</span>
                          <span className={`font-mono text-[11px] font-semibold ${isRevoked ? 'text-slate-500 line-through' : 'text-cyan-400'}`}>
                            {g.permission}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Granted: {new Date(g.grantedAt).toLocaleString()}
                          {g.expiresAt && ` · Expires: ${new Date(g.expiresAt).toLocaleTimeString()}`}
                          {isRevoked && (
                            <span className="text-rose-400 ml-2 font-semibold">
                              Revoked at {new Date(g.revokedAt!).toLocaleTimeString()}
                            </span>
                          )}
                        </div>
                      </div>

                      {!isRevoked ? (
                        <button
                          onClick={() => handleRevoke(g.userId)}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 rounded-md transition-colors"
                          title="Instant Revocation"
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                          <span>Revoke</span>
                        </button>
                      ) : (
                        <span className="text-[11px] font-mono text-rose-400/80">Revoked</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
