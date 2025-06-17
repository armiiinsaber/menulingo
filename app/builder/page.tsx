/* eslint-disable */
// @ts-nocheck
"use client";

import { useState } from "react";
import DataGrid from "react-data-grid";
import { useRouter } from "next/navigation";

export default function Builder() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const columns = [
    { key: "dish", name: "Dish", editable: true },
    { key: "desc", name: "Description", editable: true, width: 360 },
    { key: "price", name: "Price", editable: true }
  ];

  /* ---------- handle file upload → call /api/ocr ---------- */
  async function handleFile(e) {
    if (!e.target.files?.[0]) return;
    setLoading(true);

    const form = new FormData();
    form.append("file", e.target.files[0]);

    const r = await fetch("/api/ocr", { method: "POST", body: form });
    const { lines, error } = await r.json();
    if (error) return alert(error);

    const parsed = lines.map((l) => {
      const [dish = "", desc = "", price = ""] = l.split("|").map((s) => s.trim());
      return { dish, desc, price };
    });
    setRows(parsed);
    setLoading(false);
  }

  /* ---------- call your existing /api/generate ---------- */
  async function handleGenerate() {
    setLoading(true);
    const body = JSON.stringify({
      items: rows,
      languages: ["fr", "es"] // quick default
    });
    const r = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body
    });
    const j = await r.json();
    setLoading(false);
    if (j.slug) router.push("/" + j.slug);
    else alert(j.error || "Server error");
  }

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h2>Menu Builder</h2>

      <input
        type="file"
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
            style={{ marginTop: 20, padding: "10px 24px", fontSize: 16 }}
          >
            {loading ? "Working…" : "Translate & Generate QR"}
          </button>
        </>
      )}
    </div>
  );
}
