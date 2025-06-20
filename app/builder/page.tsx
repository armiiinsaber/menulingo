// File: app/builder/page.tsx
'use client';

import React, { useState } from 'react';
import DataGrid from 'react-data-grid';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import QRCode from 'react-qr-code';

export default function BuilderPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [slug, setSlug] = useState<string | null>(null);

  // Table columns
  const columns = [
    { key: 'dish',  name: 'Dish',         editable: true },
    { key: 'desc',  name: 'Description',  editable: true, width: 360 },
    { key: 'price', name: 'Price',        editable: true }
  ];

  function toObjects(arr: any[]) {
    return arr.map(([d = '', s = '', p = '']) => ({
      dish:  d.toString().trim(),
      desc:  s.toString().trim(),
      price: p.toString().trim(),
    }));
  }

  // Handle CSV/TXT upload
  async function handleCsvTxt(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setLoading(true);
    const text = await f.text();
    const parsed = Papa.parse(text, { delimiter: /,|\t|\|/, skipEmptyLines: true }).data as any[];
    setRows(toObjects(parsed));
    setLoading(false);
  }

  // Handle Excel upload
  async function handleExcel(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setLoading(true);
    const buf = await f.arrayBuffer();
    const wb  = XLSX.read(buf);
    const sh  = wb.Sheets[wb.SheetNames[0]];
    const arr = XLSX.utils.sheet_to_json(sh, { header: 1, blankrows: false }) as any[];
    setRows(toObjects(arr));
    setLoading(false);
  }

  // Generate translations & QR
  async function handleGenerate() {
    if (!rows.length) return;
    setLoading(true);
    const body = JSON.stringify({ items: rows, languages: ['English','French','Spanish','Chinese','Punjabi','Arabic','Tagalog','Italian','German','Urdu'] });
    const res = await fetch('/api/translate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
    const out = await res.json();
    setLoading(false);
    if (out.slug) {
      setSlug(out.slug);
    } else {
      alert(out.error || 'Server error');
    }
  }

  // Compute QR URL
  const qrUrl = slug && typeof window !== 'undefined'
    ? `${window.location.origin}/menu/${slug}`
    : '';

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', fontFamily: 'sans-serif', padding: '0 1rem' }}>
      <h2>Menu Builder – Upload your file</h2>

      <div style={{ marginBottom: 16 }}>
        <label style={{ marginRight: 12 }}>
          <strong>CSV / TXT:</strong>
          <input type="file" accept=".csv,.tsv,.txt" onChange={handleCsvTxt} disabled={loading} />
        </label>
        <label>
          <strong>Excel:</strong>
          <input type="file" accept=".xlsx" onChange={handleExcel} disabled={loading} />
        </label>
      </div>

      {!slug && rows.length > 0 && (
        <>
          <DataGrid columns={columns} rows={rows} onRowsChange={setRows} style={{ height: 400, border: '1px solid #ccc' }} />
          <button onClick={handleGenerate} disabled={loading} style={{ marginTop: 20, padding: '10px 24px', fontSize: 16 }}>
            {loading ? 'Working…' : 'Translate & Generate QR'}
          </button>
        </>
      )}

      {slug && (
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <QRCode value={qrUrl} size={160} />
          <p style={{ fontSize: 12, marginTop: '.5rem', wordBreak: 'break-all' }}>
            <a href={qrUrl}>{qrUrl}</a>
          </p>
        </div>
      )}
    </div>
  );
}
