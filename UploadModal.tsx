/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DocumentCategory, DocumentClassification, User } from '../types';
import { apiClient } from '../services/apiClient';
import { computeSha256 } from '../security/cryptoChain';
import { X, Upload, ShieldAlert, CheckCircle2, FileText, AlertTriangle } from 'lucide-react';

interface UploadModalProps {
  currentActor: User;
  onClose: () => void;
  onUploadSuccess: () => void;
}

const CATEGORIES: DocumentCategory[] = [
  'Compliance & Audit',
  'Legal & Contracts',
  'Human Resources',
  'Finance & Equity',
  'Executive & Board',
  'Engineering & IP'
];

export const UploadModal: React.FC<UploadModalProps> = ({
  currentActor,
  onClose,
  onUploadSuccess
}) => {
  const [title, setTitle] = useState('');
  const [filename, setFilename] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('Compliance & Audit');
  const [classification, setClassification] = useState<DocumentClassification>('CONFIDENTIAL');
  const [tags, setTags] = useState('Confidential, Secure Storage');
  
  const [sha256Preview, setSha256Preview] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContentChange = (val: string) => {
    setContent(val);
    if (val) {
      setSha256Preview(computeSha256(val));
    } else {
      setSha256Preview('');
    }
  };

  const handleLoadSample = (type: 'valid_pdf' | 'malicious_exe' | 'traversal') => {
    if (type === 'valid_pdf') {
      setTitle('Master Vendor Security Agreement - FY2026');
      setFilename('vendor_security_agreement_2026.pdf');
      const sample = `%PDF-1.7
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
TRUSTVAULT VENDOR SECURITY COMMITMENT
Classification: CONFIDENTIAL
All cryptographic controls CC6.1 through CC6.8 verified.`;
      setContent(sample);
      setSha256Preview(computeSha256(sample));
      setCategory('Legal & Contracts');
      setClassification('CONFIDENTIAL');
    } else if (type === 'malicious_exe') {
      setTitle('Q3 Automated Invoice & Payroll Patch');
      setFilename('invoice_patch.exe');
      const sample = `MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xff\xff\x00\x00 Executable payload with simulated binary shellcode`;
      setContent(sample);
      setSha256Preview(computeSha256(sample));
      setCategory('Finance & Equity');
    } else if (type === 'traversal') {
      setTitle('System Configuration Override');
      setFilename('../../../../etc/passwd');
      const sample = `root:x:0:0:root:/root:/bin/bash\ndaemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin`;
      setContent(sample);
      setSha256Preview(computeSha256(sample));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors([]);
    setIsSubmitting(true);

    const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);

    const res = await apiClient.uploadDocument({
      title,
      filename,
      content,
      category,
      classification,
      tags: tagList
    });

    setIsSubmitting(false);

    if (res.status === 201) {
      onUploadSuccess();
      onClose();
    } else {
      setValidationErrors(res.errors || ['Upload rejected by server firewall.']);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div 
        className="bg-[#0b0f19] border border-slate-800 rounded-2xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between gap-4 bg-[#0e1422]">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Upload className="w-5 h-5 text-cyan-400" />
              Upload Confidential Document
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Strict MIME verification, path traversal firewall, and instant SHA-256 integrity calculation.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Sample Presets */}
        <div className="px-5 py-2.5 bg-slate-900/60 border-b border-slate-800 text-xs flex items-center gap-2 flex-wrap">
          <span className="text-slate-500 font-medium">Quick Test Presets:</span>
          <button
            type="button"
            onClick={() => handleLoadSample('valid_pdf')}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors font-mono text-[11px]"
          >
            Valid Corporate PDF
          </button>
          <button
            type="button"
            onClick={() => handleLoadSample('malicious_exe')}
            className="px-2 py-0.5 rounded bg-rose-950/40 border border-rose-800/50 hover:bg-rose-900/60 text-rose-300 transition-colors font-mono text-[11px]"
          >
            Malicious .exe (Will Fail)
          </button>
          <button
            type="button"
            onClick={() => handleLoadSample('traversal')}
            className="px-2 py-0.5 rounded bg-amber-950/40 border border-amber-800/50 hover:bg-amber-900/60 text-amber-300 transition-colors font-mono text-[11px]"
          >
            Path Traversal (Will Fail)
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {validationErrors.length > 0 && (
            <div className="p-3.5 rounded-lg bg-rose-950/40 border border-rose-900 text-rose-200 text-xs space-y-1">
              <div className="font-semibold flex items-center gap-1.5 text-rose-300">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                Upload Firewall Rejection
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-rose-300/90 text-[11px]">
                {validationErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Document Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Master Services Agreement 2026"
                className="w-full bg-[#0e1422] border border-slate-800 text-xs text-white rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Target Filename</label>
              <input
                type="text"
                required
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="e.g. master_services_agreement.pdf"
                className="w-full bg-[#0e1422] border border-slate-800 text-xs font-mono text-white rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Classification Level</label>
              <select
                value={classification}
                onChange={(e) => setClassification(e.target.value as any)}
                className="w-full bg-[#0e1422] border border-slate-800 text-xs text-white rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500"
              >
                <option value="RESTRICTED">RESTRICTED (Owner Only by Default)</option>
                <option value="CONFIDENTIAL">CONFIDENTIAL (Department Level)</option>
                <option value="INTERNAL">INTERNAL (Internal Employees)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-[#0e1422] border border-slate-800 text-xs text-white rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Document Payload / Text Content
            </label>
            <textarea
              required
              rows={5}
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Paste or type document text content here..."
              className="w-full bg-[#070a12] border border-slate-800 text-xs font-mono text-slate-200 rounded-lg p-3 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {sha256Preview && (
            <div className="p-2.5 bg-slate-900 border border-slate-800/80 rounded-lg text-[11px] font-mono text-slate-400 flex items-center justify-between">
              <span className="text-slate-500">Live SHA-256 Checksum:</span>
              <span className="text-cyan-400 truncate max-w-sm">{sha256Preview}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Ingesting...' : 'Validate & Ingest Document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
