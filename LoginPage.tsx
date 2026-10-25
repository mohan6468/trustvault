/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, Role } from '../types';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  KeyRound, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Shield, 
  FileCheck2, 
  Terminal, 
  AlertCircle 
} from 'lucide-react';

interface LoginPageProps {
  onLogin: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
}

interface DemoCredential {
  role: Role;
  title: string;
  name: string;
  email: string;
  password: string;
  department: string;
  description: string;
  icon: typeof Shield;
  color: string;
}

const DEMO_CREDENTIALS: DemoCredential[] = [
  {
    role: 'admin',
    title: 'Administrator Interface',
    name: 'Sarah Chen',
    email: 'sarah.admin@trustvault.internal',
    password: 'AdminPassword2026!',
    department: 'Global Security & Compliance',
    description: 'System-wide cryptographic audit ledger, tamper detection, incident response, and governance.',
    icon: Shield,
    color: 'text-amber-400'
  },
  {
    role: 'owner',
    title: 'Document Owner Interface',
    name: 'Alice Vance',
    email: 'alice.vance@trustvault.internal',
    password: 'OwnerPassword2026!',
    department: 'People Operations & Legal Counsel',
    description: 'Upload confidential files, grant permissions, and execute instant 0ms access revocations.',
    icon: KeyRound,
    color: 'text-emerald-400'
  },
  {
    role: 'viewer',
    title: 'Viewer Interface',
    name: 'Charlie Lin',
    email: 'charlie.lin@acme-auditors.org',
    password: 'ViewerPassword2026!',
    department: 'Independent Audit Firm (SOC-2)',
    description: 'Restricted reading room. View granted files with dynamic forensic watermarks.',
    icon: Eye,
    color: 'text-cyan-400'
  }
];

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('sarah.admin@trustvault.internal');
  const [password, setPassword] = useState('AdminPassword2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await onLogin(email, password);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || 'Authentication failed. Please verify credentials.');
    }
  };

  const handleQuickSelect = async (cred: DemoCredential) => {
    setEmail(cred.email);
    setPassword(cred.password);
    setError(null);
    setIsSubmitting(true);
    const result = await onLogin(cred.email, cred.password);
    setIsSubmitting(false);
    if (!result.success) {
      setError(result.error || 'Authentication failed.');
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col justify-between selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top minimal header */}
      <header className="border-b border-slate-800/80 bg-[#0b0f19]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-950/70 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold tracking-tight text-white">TrustVault</span>
            <span className="text-xs font-mono text-cyan-400">v2.4</span>
          </div>
        </div>

        <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>FIPS 180-4 Security Active</span>
        </div>
      </header>

      {/* Main Login Hero & Container */}
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col lg:flex-row items-center gap-12 justify-center flex-1">
        {/* Left Side: Presentation & Three Interfaces overview */}
        <div className="flex-1 space-y-6 max-w-xl">
          <div className="space-y-2">
            <span className="text-xs font-mono text-cyan-400 tracking-wider font-semibold uppercase">
              Zero-Trust Access Gateway
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
              One Secure Platform. Three Tailored Role Interfaces.
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Log in with role-specific credentials to enter custom workspaces configured for Administrators, Document Owners, or Viewers. All access is validated on every request and sealed in an immutable cryptographic audit chain.
            </p>
          </div>

          {/* 3 Role Interface selector cards */}
          <div className="space-y-3 pt-2">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">
              Click to Auto-Authenticate with Role Credentials:
            </span>

            {DEMO_CREDENTIALS.map((cred) => {
              const Icon = cred.icon;
              const isSelected = email === cred.email;

              return (
                <div
                  key={cred.role}
                  onClick={() => handleQuickSelect(cred)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                    isSelected
                      ? 'bg-slate-900 border-cyan-500/60 shadow-lg shadow-cyan-950/40'
                      : 'bg-[#0e1422]/90 border-slate-800/80 hover:border-slate-700 hover:bg-slate-850/60'
                  }`}
                >
                  <div className={`p-2 rounded-lg bg-slate-950 border border-slate-800 shrink-0 mt-0.5 ${cred.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="text-xs font-bold text-white tracking-wide">
                        {cred.title}
                      </h3>
                      <span className="text-[11px] font-mono text-cyan-400">
                        {cred.name}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                      {cred.description}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-1.5">
                      <span>{cred.email}</span>
                      <span>·</span>
                      <span>Password: {cred.password}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Professional Login Form */}
        <div className="w-full max-w-md bg-[#0e1422] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white">Identity Authentication</h2>
            <p className="text-xs text-slate-400 mt-1">
              Enter your corporate credentials to establish an authenticated security session.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-rose-950/50 border border-rose-800/80 rounded-lg text-xs text-rose-200 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Corporate Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. sarah.admin@trustvault.internal"
                  className="w-full bg-[#070a12] border border-slate-700/80 text-xs font-mono text-white pl-10 pr-4 py-2.5 rounded-lg focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Password
                </label>
                <span className="text-[11px] text-slate-500">Encrypted (TLS 1.3)</span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password..."
                  className="w-full bg-[#070a12] border border-slate-700/80 text-xs font-mono text-white pl-10 pr-10 py-2.5 rounded-lg focus:outline-none focus:border-cyan-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm shadow-cyan-950/60 disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Authenticating Identity...' : 'Authorize Session & Enter'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Security Invariant Guarantee */}
          <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-500 space-y-1 font-mono">
            <div>Root Authority: FIPS 180-4 SHA-256 Ledger</div>
            <div>Revocation Policy: Real-Time Active Grant Check (0ms)</div>
          </div>
        </div>
      </main>

      {/* Minimal footer */}
      <footer className="border-t border-slate-800/80 bg-[#070a12] py-4 px-6 text-xs text-slate-500 text-center">
        TrustVault Systems Inc. · Zero-Trust Confidential Document Repository · All authentication attempts are permanently logged.
      </footer>
    </div>
  );
};
