/* eslint-disable */
/* @ts-nocheck */
'use client';

import { useState } from 'react';
import DataGrid from 'react-data-grid';
import { useRouter } from 'next/navigation';

export default function Builder() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  /* ─────────────────────────────────────────────
     Grid columns
  ───────────────────────────────────────────── */
  const columns = [
    { key: 'dish', name: 'Dish', editable: true },
    { key: 'desc', name: 'Description', editable: true, width: 360 },
    { key: 'price', name: 'Price', editable: true }
  ];

  /* ─────────────────────────────────────────────
     Upload → /api/ocr
  ───────────────────────────────────────────── */
  async function handleFile(e: any) {
    if (!e.target.files?.[0]) return;
    setLoading(true);

    const form = new FormData();
    form.append('file', e.target.files[0]);

    const r = await fetch('/api/ocr', { method: 'POST', body: form });
    const json = await r.json();
    const { lines = [], error } = json;

    /* ---------- DEBUG OUTPUT ---------- */
    console.log('DEBUG-OCR RESPONSE ↓↓↓');
    console.log(json.debug || json);
    alert(
      error
        ? 'OCR error: ' + error
        : `OCR returned ${lines.length} lines.\n\nOpen DevTools › Console to view the full JSON.`
    );
    /* ---------------------------------- */

    if (error || !lines.length) {
      setRows([]);
      setLoading(false);
      return;
    }

    // convert "Dish | Desc | Price" → objects
    const parsed = lines.map((l: string) => {
      const [dish = '', desc = '', price = ''] = l.split('|').map(s => s.trim());
      return { dish, desc, price };
    });

    setRows(parsed);
    setLoading(false);
  }

  /* ─────────────────────────────────────────────
     Translate & save → /api/generate
  ───────────────────────────────────────────── */
  async function handleGenerate() {
    if (!rows.length) return;
    setLoading(true);

    const body = JSON.stringify({
      items: rows,
      languages: ['fr', 'es'] // default for now
    });

    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body
    });
    const out = await res.json();
    setLoading(false);

    out.slug ? router.push('/' + out.slug) : alert(out.error || 'Server error');
  }

  /* ─────────────────────────────────────────────
     Render
  ───────────────────────────────────────────── */
  return (
    <div style={{ maxWidth: 900, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h2>Menu Builder (OCR debug mode)</h2>

      <input
        type="file"
        name="file"
        accept=".pdf,image/*"
        disabled={loading}
        onChange={handleFile}
      />

      {rows.length > 0 && (
        <>
          <DataGrid
            columns={columns}
            rows={rows}
            onRowsChange={setRows}
            style={{ height: 400, marginTop: 20 }}
          />

          <button
            onClick={handleGenerate}
            disabled={loading}
            style={{ marginTop: 20, padding: '10px 24px', fontSize: 16 }}
          >
            {loading ? 'Working…' : 'Translate & Generate QR'}
          </button>
        </>
      )}
    </div>
  );
}
