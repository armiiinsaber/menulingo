/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

import { NextRequest, NextResponse } from 'next/server';
import Busboy from 'busboy';
import { Readable } from 'node:stream';

/* ────────────────────────────────
   Mindee configuration
   (swap URL if you’re using a
   different custom endpoint)
────────────────────────────────── */
const MINDEE_API_KEY = process.env.MINDEE_API_KEY;
const MINDEE_URL =
  'https://api.mindee.net/v1/products/<YOUR_USER>/<YOUR_PRODUCT>/v1/predict_async'; // ← replace with your real endpoint

/* ────────────────────────────────
   Parse multipart/form-data upload
────────────────────────────────── */
function parseFile(req: NextRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const bb = Busboy({ headers: Object.fromEntries(req.headers) as any });
    const chunks: Buffer[] = [];

    bb.on('file', (_field, stream) => {
      stream.on('data', (d: Buffer) => chunks.push(d));
    });
    bb.on('error', reject);
    bb.on('finish', () => {
      if (!chunks.length) return reject(new Error('No file received'));
      resolve(Buffer.concat(chunks));
    });

    Readable.fromWeb(req.body as any).pipe(bb);
  });
}

/* ────────────────────────────────
   POST /api/ocr
────────────────────────────────── */
export async function POST(req: NextRequest) {
  try {
    const buf = await parseFile(req);

    // Mindee expects field name "document"
    const form = new FormData();
    form.set('document', new Blob([buf]), 'menu.pdf');

    const resp = await fetch(MINDEE_URL, {
      method: 'POST',
      headers: { Authorization: `Token ${MINDEE_API_KEY}` },
      body: form
    });

    const result = await resp.json();

    // Extract lines if they exist
    const lines =
      result?.document?.inference?.prediction?.lines?.map((l: any) => (l.value || '').trim()) ||
      [];

    return NextResponse.json({ debug: result, lines });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'OCR processing failed' },
      { status: 400 }
    );
  }
}

/* ensure this route is always dynamic (no caching) */
export const dynamic = 'force-dynamic';
