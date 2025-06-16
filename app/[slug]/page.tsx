/* eslint-disable */

import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

type Props = {
  params: { slug: string };
};

export default async function Page({ params }: Props) {
  /* ---------- fetch data ---------- */
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase
    .from('menus')
    .select('json_menu,languages')
    .eq('slug', params.slug)
    .single();

  if (error || !data) notFound();

  const { json_menu, languages } = data as {
    json_menu: {
      dish: Record<string, string>;
      desc: Record<string, string>;
      price: number;
    }[];
    languages: string[];
  };

  /* ---------- simple client-side language switch ---------- */
  const defaultLang = languages[0] ?? 'en';

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <select
        defaultValue={defaultLang}
        onChange={(e) =>
          (window.location.search = '?lang=' + e.target.value)
        }
        style={{ fontSize: 18, marginBottom: 20 }}
      >
        {languages.map((l) => (
          <option key={l} value={l}>
            {l.toUpperCase()}
          </option>
        ))}
      </select>

      {json_menu.map((it, i) => {
        const lang =
          new URLSearchParams(window.location.search).get('lang') ??
          defaultLang;
        return (
          <div key={i} style={{ margin: '12px 0' }}>
            <strong>{it.dish[lang]}</strong>
            <span style={{ float: 'right' }}>${it.price}</span>
            <br />
            <small>{it.desc[lang]}</small>
          </div>
        );
      })}
    </div>
  );
}
