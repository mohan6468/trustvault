/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldCheck, Plus, Terminal, LogOut, KeyRound, Shield, Eye } from 'lucide-react';
import { User, Role } from '../types';

interface NavbarProps {
  currentActor: User;
  onLogout: () => void;
  onOpenUpload?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentActor, onLogout, onOpenUpload }) => {
  const getRoleBadge = (role: Role) => {
    switch (role) {
      case 'admin':
        return { label: 'Administrator', icon: Shield, color: 'text-amber-400 bg-amber-950/40 border-amber-800/60' };
      case 'owner':
        return { label: 'Document Owner', icon: KeyRound, color: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60' };
      case 'viewer':
        return { label: 'Viewer', icon: Eye, color: 'text-cyan-400 bg-cyan-950/40 border-cyan-800/60' };
      case 'intruder':
        return { label: 'Untrusted Intruder', icon: ShieldCheck, color: 'text-rose-400 bg-rose-950/40 border-rose-800/60' };
    }
  };

  const badge = getRoleBadge(currentActor.role);
  const BadgeIcon = badge.icon;

  return (
    <header className="border-b border-slate-800 bg-[#0b0f19]/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
          <div className="w-8 h-8 rounded-lg bg-cyan-950/70 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold tracking-tight text-white">TrustVault</span>
            <span className="text-xs font-mono text-cyan-400 tracking-wider">v2.4</span>
          </div>
        </div>

        {/* Zone 2: Active Identity & Role Indicator */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono">
            <BadgeIcon className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-white font-semibold font-sans">{currentActor.name}</span>
            <span className="text-slate-600">·</span>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${badge.color}`}>
              {badge.label}
            </span>
          </div>
        </div>

        {/* Zone 3: Actions (Upload if Owner + Sign Out) */}
        <div className="flex items-center gap-2.5 shrink-0">
          {currentActor.role === 'owner' && onOpenUpload && (
            <button
              onClick={onOpenUpload}
              className="hidden md:flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm shadow-cyan-950"
            >
              <Plus className="w-4 h-4" />
              Upload Document
            </button>
          )}

          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-lg transition-colors"
            title="Sign out of session"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-400" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};
