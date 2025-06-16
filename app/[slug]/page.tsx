/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable */
// @ts-nocheck

import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function Page({ params }) {
  /* ---------- fetch row from Supabase ---------- */
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const { data } = await supabase
    .from('menus')
    .select('json_menu,languages')
    .eq('slug', params.slug)
    .single();

  if (!data) notFound();

  const { json_menu, languages } = data;
  const lang = languages?.[0] ?? 'en';

  /* ---------- convert object → array if needed ---------- */
  let rows = [];

  if (Array.isArray(json_menu)) {
    // already in array-of-rows shape
    rows = json_menu;
  } else if (json_menu && typeof json_menu === 'object') {
    // current shape: { es: [...], fr: [...], … }
    const firstLang = Object.keys(json_menu)[0];
    rows = json_menu[firstLang].map((_, i) => {
      const dish = {};
      const desc = {};

      for (const l of Object.keys(json_menu)) {
        dish[l] = json_menu[l][i]?.dish ?? '';
        desc[l] = json_menu[l][i]?.desc ?? '';
      }

      return { dish, desc, price: json_menu[firstLang][i]?.price ?? 0 };
    });
  }

  /* ---------- render ---------- */
  return (
    <main style={{ maxWidth: 600, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h2 style={{ textTransform: 'uppercase', marginBottom: 24 }}>{lang} MENU</h2>

      {rows.map((item, idx) => (
        <div key={idx} style={{ margin: '12px 0' }}>
          <strong>{item.dish[lang]}</strong>
          <span style={{ float: 'right' }}>${item.price}</span>
          <br />
          <small>{item.desc[lang]}</small>
        </div>
      ))}
    </main>
  );
}
