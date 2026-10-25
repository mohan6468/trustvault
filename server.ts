/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { vaultService } from './src/services/vaultService.ts';
import type { User } from './src/types/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  app.use(express.json({ limit: '30mb' }));

  // Helper middleware to extract actor from request header
  function getActor(req: express.Request): User {
    const actorId = (req.headers['x-actor-id'] as string) || 'usr_owner_alice';
    const user = vaultService.getUserById(actorId);
    if (!user) {
      // Default to intruder if unknown
      return {
        id: actorId,
        name: 'Unrecognized Client',
        email: 'anonymous@external-client.net',
        role: 'intruder',
        department: 'External Untrusted',
        ipAddress: req.ip || '127.0.0.1'
      };
    }
    return user;
  }

  // --- REST API ENDPOINTS ---

  // 0. Authentication login
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const result = vaultService.login(email, password);
    res.status(result.status).json(result);
  });

  // 1. Users directory
  app.get('/api/users', (_req, res) => {
    res.json(vaultService.getUsers());
  });

  // 2. Documents inventory (Zero-trust visibility)
  app.get('/api/documents', (req, res) => {
    const actor = getActor(req);
    const search = req.query.search as string;
    const category = req.query.category as string;
    const ownerId = req.query.ownerId as string;

    const docs = vaultService.getDocuments(actor, { search, category, ownerId });
    res.json(docs);
  });

  // 3. Document details
  app.get('/api/documents/:id', (req, res) => {
    const actor = getActor(req);
    const result = vaultService.getDocumentById(actor, req.params.id);
    res.status(result.status).json(result);
  });

  // 4. Secure Read payload with dynamic watermark
  app.get('/api/documents/:id/read', (req, res) => {
    const actor = getActor(req);
    const result = vaultService.readDocumentContent(actor, req.params.id);
    res.status(result.status).json(result);
  });

  // 5. Secure Download payload
  app.get('/api/documents/:id/download', (req, res) => {
    const actor = getActor(req);
    const result = vaultService.downloadDocument(actor, req.params.id);
    if (result.status !== 200) {
      res.status(result.status).json({ error: result.error });
      return;
    }

    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.setHeader('Content-Type', result.mimeType || 'application/octet-stream');
    res.send(result.content);
  });

  // 6. Upload new document
  app.post('/api/documents', (req, res) => {
    const actor = getActor(req);
    const { title, filename, content, category, classification, tags } = req.body;
    const result = vaultService.uploadDocument(actor, {
      title,
      filename,
      content,
      category,
      classification,
      tags
    });
    res.status(result.status).json(result);
  });

  // 7. Delete document
  app.delete('/api/documents/:id', (req, res) => {
    const actor = getActor(req);
    const result = vaultService.deleteDocument(actor, req.params.id);
    res.status(result.status).json(result);
  });

  // 8. Grant permission
  app.post('/api/documents/:id/permissions', (req, res) => {
    const actor = getActor(req);
    const { targetUserId, permission, expiresMinutes } = req.body;
    const result = vaultService.grantPermission(actor, req.params.id, targetUserId, permission, expiresMinutes);
    res.status(result.status).json(result);
  });

  // 9. Instant Revocation
  app.delete('/api/documents/:id/permissions/:userId', (req, res) => {
    const actor = getActor(req);
    const result = vaultService.revokePermission(actor, req.params.id, req.params.userId);
    res.status(result.status).json(result);
  });

  // 10. Generate ephemeral link
  app.post('/api/documents/:id/ephemeral-link', (req, res) => {
    const actor = getActor(req);
    const durationSeconds = req.body.durationSeconds || 60;
    const result = vaultService.generateEphemeralAccessToken(actor, req.params.id, durationSeconds);
    res.status(result.status).json(result);
  });

  // 11. Audit trail records
  app.get('/api/audit', (req, res) => {
    const actor = getActor(req);
    const documentId = req.query.documentId as string | undefined;
    const result = vaultService.getAuditTrail(actor, documentId);
    res.status(result.status).json(result);
  });

  // 12. Verify audit chain integrity
  app.post('/api/audit/verify', (_req, res) => {
    const result = vaultService.verifyAuditTrailIntegrity();
    res.json(result);
  });

  // 13. Audit tamper simulation demonstration
  app.post('/api/audit/tamper-demo', (req, res) => {
    const blockIndex = req.body.blockIndex ?? 2;
    const fakeDetails = req.body.fakeDetails || 'Unauthorized DB Modification: Record content quietly rewritten';
    const result = vaultService.simulateTamperAttack(blockIndex, fakeDetails);
    res.json(result);
  });

  // 14. Audit chain restoration after demo
  app.post('/api/audit/restore-demo', (_req, res) => {
    vaultService.restoreChainIntegrity();
    res.json({ success: true, message: 'Chain restored to pristine cryptographic state.' });
  });

  // 15. Penetration attack simulation runner
  app.post('/api/test/penetration', async (req, res) => {
    const scenarioId = req.body.scenarioId;
    try {
      const result = await vaultService.runSecurityPenetrationTest(scenarioId);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Mount Vite middleware for SPA
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n  ======================================================`);
    console.log(`  🛡️  TrustVault RBAC Application is ACTIVE`);
    console.log(`  ➜  Local:    http://localhost:${PORT}/`);
    console.log(`  ➜  Network:  http://127.0.0.1:${PORT}/`);
    console.log(`  👉  Hold Ctrl (or Cmd) and click the link, or open:`);
    console.log(`      http://localhost:${PORT}`);
    console.log(`  ======================================================\n`);
  });
}

startServer();
