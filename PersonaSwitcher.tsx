/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { User, Role } from '../types';
import { Shield, KeyRound, Eye, Skull, UserCheck, Network } from 'lucide-react';

interface PersonaSwitcherProps {
  users: User[];
  currentActor: User;
  onSelectActor: (user: User) => void;
}

export const PersonaSwitcher: React.FC<PersonaSwitcherProps> = ({
  users,
  currentActor,
  onSelectActor
}) => {
  const getRoleIcon = (role: Role) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4 text-amber-400" />;
      case 'owner':
        return <KeyRound className="w-4 h-4 text-emerald-400" />;
      case 'viewer':
        return <Eye className="w-4 h-4 text-cyan-400" />;
      case 'intruder':
        return <Skull className="w-4 h-4 text-rose-400" />;
    }
  };

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'owner':
        return 'Document Owner';
      case 'viewer':
        return 'Viewer';
      case 'intruder':
        return 'External Intruder';
    }
  };

  return (
    <div className="bg-[#0e1422] border-b border-slate-800/80 px-4 sm:px-6 lg:px-8 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Active persona status */}
        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-400 font-medium">Active Evaluation Persona:</span>
          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 rounded-lg px-2.5 py-1">
            {getRoleIcon(currentActor.role)}
            <span className="font-semibold text-white">{currentActor.name}</span>
            <span className="text-slate-500 font-mono">·</span>
            <span className="text-slate-300 font-medium">{getRoleBadge(currentActor.role)}</span>
            <span className="text-slate-500 font-mono">·</span>
            <span className="text-slate-400 hidden sm:inline">{currentActor.department}</span>
            <span className="text-slate-500 font-mono hidden sm:inline">·</span>
            <span className="text-slate-400 font-mono hidden md:inline">{currentActor.ipAddress}</span>
          </div>
        </div>

        {/* 1-Click persona switchers */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-slate-500 mr-1 hidden lg:inline">Switch Persona:</span>
          {users.map(u => {
            const isSelected = u.id === currentActor.id;
            return (
              <button
                key={u.id}
                onClick={() => onSelectActor(u)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-slate-800 text-white border border-slate-600 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                }`}
                title={`${u.name} (${u.role}): ${u.department}`}
              >
                {getRoleIcon(u.role)}
                <span>{u.name.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
