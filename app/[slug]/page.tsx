/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable */

// @ts-nocheck

import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function Page({ params }) {
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

  return (
    <main style={{ maxWidth: 600, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h2 style={{ textTransform: 'uppercase', marginBottom: 24 }}>{lang} MENU</h2>
      {json_menu.map((item, idx) => (
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
