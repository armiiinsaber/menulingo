import { NextRequest, NextResponse } from 'next/server';
import Busboy from 'busboy';
import { Readable } from 'node:stream';

const MINDEE_API_KEY = process.env.MINDEE_API_KEY;
const MINDEE_URL =
  'https://api.mindee.net/v1/products/<YOUR_USER>/<YOUR_PRODUCT>/v1/predict_async'; // ← replace if needed

function parseFile(req: NextRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const bb = Busboy({ headers: Object.fromEntries(req.headers) as any });
    const chunks: Buffer[] = [];

    bb.on('file', (_name, stream) => {
      stream.on('data', (d: Buffer) => chunks.push(d));
    });
    bb.on('finish', () => {
      if (!chunks.length) return reject(new Error('No file received'));
      resolve(Buffer.concat(chunks));
    });
    bb.on('error', reject);

    Readable.fromWeb(req.body as any).pipe(bb);
  });
}

export async function POST(req: NextRequest) {
  try {
    const buf = await parseFile(req);

    const form = new FormData();
    form.set('document', new Blob([buf]), 'menu.pdf');

    const r = await fetch(MINDEE_URL, {
      method: 'POST',
      headers: { Authorization: `Token ${MINDEE_API_KEY}` },
      body: form
    });

    const result = await r.json();
    const lines =
      result?.document?.inference?.prediction?.lines?.map((l: any) => (l.value || '').trim()) ||
      [];

    return NextResponse.json({ debug: result, lines });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
