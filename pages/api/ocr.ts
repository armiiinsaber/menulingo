/* eslint-disable */
// @ts-nocheck

/**
 * POST /api/ocr
 * Body: multipart/form-data  (one `file` field containing a PDF or an image)
 * Returns: { lines: string[] }   ← raw text lines Mindee extracted
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import Busboy from 'busboy';           // ✓ installs with `npm i busboy`
import FormData from 'form-data';      // ✓ `npm i form-data`
import fetch from 'node-fetch';        // ✓ `npm i node-fetch`

export const config = { api: { bodyParser: false } }; // allow streaming uploads

const OCR_URL =
  'https://api.mindee.net/v1/products/mindee/document/v1/predict'; // generic endpoint

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Use POST with a file field' });

  /* ------------------------------------------------------------------------ */
  /* 1) read the uploaded file (buffer)                                       */
  /* ------------------------------------------------------------------------ */
  const bb = Busboy({ headers: req.headers });
  let fileBuf: Buffer | null = null;

  bb.on('file', (_, stream) => {
    const chunks: Buffer[] = [];
    stream.on('data', (c) => chunks.push(c));
    stream.on('end', () => {
      fileBuf = Buffer.concat(chunks);
    });
  });

  bb.on('finish', async () => {
    if (!fileBuf) return res.status(400).json({ error: 'No file received' });

    /* ---------------------------------------------------------------------- */
    /* 2) send to Mindee OCR                                                  */
    /* ---------------------------------------------------------------------- */
    const form = new FormData();
    form.append('document', fileBuf, 'menu.pdf');

    try {
      const r = await fetch(OCR_URL, {
        method: 'POST',
        headers: { Authorization: `Token ${process.env.MINDEE_API_KEY}` },
        body: form
      });
      const json: any = await r.json();

      /* -------------------------------------------------------------------- */
      /* 3) extract raw text lines                                            */
      /* -------------------------------------------------------------------- */
      const lines: string[] =
        json.pages?.flatMap((p: any) => p.lines.map((l: any) => l.text)) ?? [];

      return res.status(200).json({ lines });
    } catch (err) {
      console.error('ocr-error', err);
      return res.status(500).json({ error: 'OCR request failed' });
    }
  });

  req.pipe(bb);
}
