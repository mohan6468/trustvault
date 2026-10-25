/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { computeSha256 } from './cryptoChain.ts';

export interface FileValidationResult {
  valid: boolean;
  sanitizedFilename: string;
  mimeType: string;
  sha256Hash: string;
  fileSize: number;
  errors: string[];
}

const BANNED_EXTENSIONS = new Set([
  'exe', 'dll', 'bat', 'cmd', 'sh', 'bash', 'vbs', 'ps1', 'jar',
  'com', 'scr', 'msi', 'bin', 'py', 'rb', 'php', 'phtml', 'cgi',
  'svg', 'htm', 'html', 'xhtml', 'js', 'mjs', 'ts'
]);

const ALLOWED_EXTENSIONS = new Map<string, string>([
  ['pdf', 'application/pdf'],
  ['docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  ['xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  ['csv', 'text/csv'],
  ['txt', 'text/plain'],
  ['json', 'application/json'],
  ['png', 'image/png'],
  ['jpg', 'image/jpeg'],
  ['jpeg', 'image/jpeg'],
  ['zip', 'application/zip']
]);

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

/**
 * Validates uploaded document for security:
 * 1. Path traversal attacks (e.g. `../../etc/passwd` or `..\boot.ini`)
 * 2. Dangerous executable and script file extensions
 * 3. File size constraints (<= 25MB)
 * 4. Dangerous script/payload sniffing in text files
 * 5. Cryptographic SHA-256 integrity hash calculation
 */
export function validateDocumentUpload(
  rawFilename: string,
  content: string,
  providedMime?: string
): FileValidationResult {
  const errors: string[] = [];

  // 1. Path traversal & null byte sanitization
  if (rawFilename.includes('\0')) {
    errors.push('Security Violation: Filename contains prohibited null byte.');
  }

  if (rawFilename.includes('../') || rawFilename.includes('..\\') || rawFilename.startsWith('/') || rawFilename.startsWith('\\')) {
    errors.push('Security Violation: Path traversal pattern detected in filename.');
  }

  // Strip path directories, isolate base name
  const sanitizedFilename = rawFilename
    .replace(/^.*[\\/]/, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .trim();

  if (!sanitizedFilename || sanitizedFilename === '.' || sanitizedFilename === '..') {
    errors.push('Invalid filename: Empty or invalid base filename.');
  }

  // 2. Extension check
  const parts = sanitizedFilename.split('.');
  const ext = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';

  if (!ext) {
    errors.push('File missing extension. An authorized document extension is required.');
  }

  if (BANNED_EXTENSIONS.has(ext)) {
    errors.push(`Security Violation: File extension .${ext} is classified as high-risk/executable and blocked.`);
  }

  const recognizedMime = ALLOWED_EXTENSIONS.get(ext);
  if (!recognizedMime) {
    errors.push(`Unsupported file format .${ext}. Only certified corporate document formats are allowed.`);
  }

  // 3. File size check
  const fileSize = new Blob([content]).size;
  if (fileSize <= 0) {
    errors.push('Uploaded file is empty (0 bytes).');
  }

  if (fileSize > MAX_FILE_SIZE) {
    errors.push(`File exceeds maximum size threshold of 25MB (Received: ${(fileSize / 1024 / 1024).toFixed(2)} MB).`);
  }

  // 4. Content payload inspection for stored XSS or embedded scripts
  const lowerContent = content.slice(0, 4096).toLowerCase();
  if (
    lowerContent.includes('<script') ||
    lowerContent.includes('javascript:') ||
    lowerContent.includes('onerror=') ||
    lowerContent.includes('onload=') ||
    lowerContent.includes('<?php') ||
    lowerContent.includes('#!/bin/')
  ) {
    errors.push('Security Violation: Content payload contains embedded executable script tokens.');
  }

  // 5. Calculate SHA-256 integrity hash
  const sha256Hash = computeSha256(content);

  return {
    valid: errors.length === 0,
    sanitizedFilename,
    mimeType: recognizedMime || providedMime || 'application/octet-stream',
    sha256Hash,
    fileSize,
    errors
  };
}
