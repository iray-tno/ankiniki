/**
 * Export Routes - Deck export as .apkg
 */

import { Router, Request, Response } from 'express';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { ankiConnect } from '../services/ankiConnect';
import { logger } from '../utils/logger';
import { fail } from '../utils/response';

const router = Router();

/**
 * GET /api/export/deck/:name
 *
 * Export a deck as a downloadable .apkg file.
 * Query params:
 *   includeSched=true  — include scheduling/review data (default: false)
 *
 * Example:
 *   GET /api/export/deck/JavaScript
 *   GET /api/export/deck/Programming%3A%3ARust?includeSched=true
 */
router.get('/deck/:name', async (req: Request, res: Response) => {
  const deckName = decodeURIComponent(req.params.name);
  const includeSched = req.query.includeSched === 'true';

  const tmpFile = path.join(os.tmpdir(), `ankiniki-export-${Date.now()}.apkg`);

  try {
    // Verify deck exists
    const decks = await ankiConnect.getDeckNames();
    if (!decks.includes(deckName)) {
      return res.status(404).json(fail(`Deck "${deckName}" not found`));
    }

    logger.info('Exporting deck', { deckName, includeSched, tmpFile });

    const exported = await ankiConnect.exportPackage(
      deckName,
      tmpFile,
      includeSched
    );
    if (!exported) {
      return res
        .status(500)
        .json(fail('AnkiConnect failed to export the deck'));
    }

    if (!fs.existsSync(tmpFile)) {
      return res.status(500).json(fail('Export file was not created'));
    }

    const stat = fs.statSync(tmpFile);
    const safeFileName = `${deckName.replace(/[^a-zA-Z0-9_\-. ]/g, '_')}.apkg`;

    logger.info('Streaming export file', {
      deckName,
      size: stat.size,
      safeFileName,
    });

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${safeFileName}"`
    );
    res.setHeader('Content-Length', stat.size);

    const stream = fs.createReadStream(tmpFile);
    stream.pipe(res);

    stream.on('end', () => {
      fs.unlink(tmpFile, err => {
        if (err) {
          logger.warn('Failed to delete temp export file', { tmpFile });
        }
      });
    });

    stream.on('error', err => {
      logger.error('Error streaming export file', err);
      fs.unlink(tmpFile, () => {});
      if (!res.headersSent) {
        res.status(500).json(fail('Failed to stream file'));
      }
    });
  } catch (error) {
    fs.unlink(tmpFile, () => {});
    logger.error('Deck export error', error);
    res
      .status(500)
      .json(
        fail(error instanceof Error ? error.message : 'Internal server error')
      );
  }
});

export default router;
