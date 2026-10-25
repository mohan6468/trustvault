/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LoginPage } from './components/LoginPage';
import { AdminDashboard } from './components/AdminDashboard';
import { OwnerDashboard } from './components/OwnerDashboard';
import { ViewerDashboard } from './components/ViewerDashboard';
import { DocumentViewerModal } from './components/DocumentViewerModal';
import { UploadModal } from './components/UploadModal';
import { PermissionsModal } from './components/PermissionsModal';
import { apiClient } from './services/apiClient';
import { User, VaultDocument } from './types';
import { ShieldAlert, Lock, ArrowLeft } from 'lucide-react';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [currentActor, setCurrentActor] = useState<User>(apiClient.getActor());
  const [documents, setDocuments] = useState<VaultDocument[]>([]);

  // Search & Filters for Owner / Vault views
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modals
  const [selectedDocForViewer, setSelectedDocForViewer] = useState<VaultDocument | null>(null);
  const [selectedDocForPermissions, setSelectedDocForPermissions] = useState<VaultDocument | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Initialize users and documents
  useEffect(() => {
    async function init() {
      const u = await apiClient.getUsers();
      setUsers(u);
      const docs = await apiClient.getDocuments();
      setDocuments(docs);
    }
    init();
  }, []);

  const refreshDocuments = async () => {
    const docs = await apiClient.getDocuments({
      search: searchQuery,
      category: selectedCategory !== 'All' ? selectedCategory : undefined
    });
    setDocuments(docs);
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshDocuments();
    }
  }, [currentActor.id, searchQuery, selectedCategory, isAuthenticated]);

  const handleLogin = async (email: string, password?: string) => {
    const res = await apiClient.login(email, password);
    if (res.status === 200 && res.user) {
      setCurrentActor(res.user);
      setIsAuthenticated(true);
      await refreshDocuments();
      return { success: true };
    }
    return { success: false, error: res.error || 'Authentication failed.' };
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setSelectedDocForViewer(null);
    setSelectedDocForPermissions(null);
    setIsUploadOpen(false);
  };

  const handleSelectActor = (user: User) => {
    setCurrentActor(user);
    apiClient.setActor(user);
  };

  const handleDownload = async (doc: VaultDocument) => {
    const res = await apiClient.downloadDocument(doc.id);
    if (res.status === 200 && res.content) {
      const blob = new Blob([res.content], { type: res.mimeType || 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.filename || doc.filename;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      alert(`Download Refused: ${res.error || 'Access Denied: You do not have download privileges.'}`);
      refreshDocuments();
    }
  };

  const handleDelete = async (doc: VaultDocument) => {
    if (!confirm(`Are you sure you want to delete "${doc.title}"? This action is permanent and will be logged in the cryptographic audit trail.`)) {
      return;
    }
    const res = await apiClient.deleteDocument(doc.id);
    if (res.status === 200) {
      refreshDocuments();
    } else {
      alert(`Delete Refused: ${res.error}`);
    }
  };

  // If not authenticated, render Login Page
  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans">
      {/* 1. Header with Role Badge and Sign Out */}
      <Navbar
        currentActor={currentActor}
        onLogout={handleLogout}
        onOpenUpload={() => setIsUploadOpen(true)}
      />

      {/* 2. Main Interface View — DYNAMICALLY TAILORED FOR THE AUTHENTICATED USER */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* INTERFACE 1: ADMINISTRATOR INTERFACE */}
        {currentActor.role === 'admin' && (
          <AdminDashboard
            currentActor={currentActor}
            allDocuments={documents}
            onOpenViewer={(doc) => setSelectedDocForViewer(doc)}
          />
        )}

        {/* INTERFACE 2: DOCUMENT OWNER INTERFACE */}
        {currentActor.role === 'owner' && (
          <OwnerDashboard
            currentActor={currentActor}
            documents={documents}
            allUsers={users}
            onOpenViewer={(doc) => setSelectedDocForViewer(doc)}
            onOpenPermissions={(doc) => setSelectedDocForPermissions(doc)}
            onOpenUpload={() => setIsUploadOpen(true)}
            onDownload={handleDownload}
            onDelete={handleDelete}
            onRefresh={refreshDocuments}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
          />
        )}

        {/* INTERFACE 3: VIEWER INTERFACE */}
        {currentActor.role === 'viewer' && (
          <ViewerDashboard
            currentActor={currentActor}
            documents={documents}
            onOpenViewer={(doc) => setSelectedDocForViewer(doc)}
            onDownload={handleDownload}
            onRefresh={refreshDocuments}
          />
        )}

        {/* UNTRUSTED INTRUDER VIEW (For testing zero-privilege boundary) */}
        {currentActor.role === 'intruder' && (
          <div className="p-10 rounded-2xl bg-[#0e1422] border border-rose-900/60 text-center space-y-4 max-w-2xl mx-auto my-8">
            <ShieldAlert className="w-14 h-14 text-rose-400 mx-auto" />
            <h2 className="text-xl font-bold text-rose-200">Zero-Trust Intruder Boundary</h2>
            <p className="text-xs text-rose-300/80 leading-relaxed">
              You are signed in as an untrusted external identity ({currentActor.email}). Zero documents, zero audit records, and zero internal resources are exposed. All attempts to request records return HTTP 403 Forbidden.
            </p>
            <div className="pt-2">
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold border border-slate-700 transition-colors"
              >
                Return to Login Page
              </button>
            </div>
          </div>
        )}
      </main>

      {/* 4. Modals */}
      {selectedDocForViewer && (
        <DocumentViewerModal
          document={selectedDocForViewer}
          currentActor={currentActor}
          allUsers={users}
          onClose={() => setSelectedDocForViewer(null)}
          onRefreshDocs={refreshDocuments}
        />
      )}

      {selectedDocForPermissions && (
        <PermissionsModal
          document={selectedDocForPermissions}
          currentActor={currentActor}
          allUsers={users}
          onClose={() => setSelectedDocForPermissions(null)}
          onUpdate={refreshDocuments}
        />
      )}

      {isUploadOpen && (
        <UploadModal
          currentActor={currentActor}
          onClose={() => setIsUploadOpen(false)}
          onUploadSuccess={refreshDocuments}
        />
      )}

      {/* 5. Footer */}
      <footer className="border-t border-slate-800/80 bg-[#070a12] py-6 px-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">TrustVault Systems Inc.</span>
            <span>·</span>
            <span>Zero-Trust Enterprise Document Sharing</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Session: {currentActor.role.toUpperCase()}</span>
            <span>·</span>
            <button onClick={handleLogout} className="hover:text-white transition-colors">
              Sign Out
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
