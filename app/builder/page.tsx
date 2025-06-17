/* eslint-disable */
'use client';

import { useState } from 'react';
import DataGrid from 'react-data-grid';
import { useRouter } from 'next/navigation';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export default function Builder() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  /* ── table columns ─────────────────────────── */
  const columns = [
    { key: 'dish',  name: 'Dish',         editable: true },
    { key: 'desc',  name: 'Description',  editable: true, width: 360 },
    { key: 'price', name: 'Price',        editable: true }
  ];

  /* ── helper: rows → objects ─────────────────── */
  function toObjects(arr) {
    return arr.map(([d = '', s = '', p = '']) => ({
      dish:  d.toString().trim(),
      desc:  s.toString().trim(),
      price: p.toString().trim()
    }));
  }

  /* ── TEXT / CSV upload ──────────────────────── */
  async function handleCsvTxt(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setLoading(true);

    const text = await f.text();
    const parsed = Papa.parse(text, {
      delimiter: /,|\t|\|/,
      skipEmptyLines: true
    }).data;

    setRows(toObjects(parsed));
    setLoading(false);
  }

  /* ── Excel upload ───────────────────────────── */
  async function handleExcel(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setLoading(true);

    const buf = await f.arrayBuffer();
    const wb  = XLSX.read(buf);
    const sh  = wb.Sheets[wb.SheetNames[0]];
    const arr = XLSX.utils.sheet_to_json(sh, { header: 1, blankrows: false });

    setRows(toObjects(arr));
    setLoading(false);
  }

  /* ── Generate QR (existing flow) ────────────── */
  async function handleGenerate() {
    if (!rows.length) return;
    setLoading(true);

    const body = JSON.stringify({
      items: rows,
      languages: ['fr', 'es']              // default; extend later
    });

    const res  = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body
    });
    const out = await res.json();
    setLoading(false);

    out.slug ? router.push('/' + out.slug) : alert(out.error || 'Server error');
  }

  /* ── UI ─────────────────────────────────────── */
  return (
    <div style={{ maxWidth: 900, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h2>Menu Builder – Upload your file</h2>

      <div style={{ marginBottom: 16 }}>
        <label style={{ marginRight: 12 }}>
          <strong>CSV / TXT: </strong>
          <input type="file"
                 accept=".csv,.tsv,.txt"
                 onChange={handleCsvTxt}
                 disabled={loading} />
        </label>

        <label>
          <strong>Excel: </strong>
          <input type="file"
                 accept=".xlsx"
                 onChange={handleExcel}
                 disabled={loading} />
        </label>
      </div>

      {rows.length > 0 && (
        <>
          <DataGrid
            columns={columns}
            rows={rows}
            onRowsChange={setRows}
            style={{ height: 400, border: '1px solid #ccc' }}
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
