/* eslint-disable */
// @ts-nocheck

import type { NextApiRequest, NextApiResponse } from 'next';
import Busboy from 'busboy';
import FormData from 'form-data';
import fetch from 'node-fetch';

export const config = { api: { bodyParser: false } };

const OCR_URL =
  'https://api.mindee.net/v1/products/mindee/document/v1/predict'; // generic OCR

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const bb = Busboy({ headers: req.headers });
  let buf: Buffer | null = null;

  bb.on('file', (_, stream) => {
    const chunks: Buffer[] = [];
    stream.on('data', (c) => chunks.push(c));
    stream.on('end', () => (buf = Buffer.concat(chunks)));
  });

  bb.on('finish', async () => {
    if (!buf) return res.status(400).json({ error: 'No file' });

    const form = new FormData();
    form.append('document', buf, 'menu.pdf');

    try {
      const r = await fetch(OCR_URL, {
        method: 'POST',
        headers: { Authorization: `Token ${process.env.MINDEE_API_KEY}` },
        body: form
      });
      const json: any = await r.json();

      const lines =
        json.pages?.flatMap((p: any) => p.lines.map((l: any) => l.text)) ?? [];

      res.status(200).json({ lines });
    } catch (err) {
      console.error('ocr-error', err);
      res.status(500).json({ error: 'OCR failed' });
    }
  });

  req.pipe(bb);
}
