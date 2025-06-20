/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable */
// @ts-nocheck

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useParams } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function MenuPage() {
  const { slug } = useParams();
  const [jsonMenu, setJsonMenu] = useState({});
  const [languages, setLanguages] = useState([]);
  const [currentLang, setCurrentLang] = useState('en');

  useEffect(() => {
    async function fetchData() {
      const { data, error } = await supabase
        .from('menus')
        .select('json_menu,languages')
        .eq('slug', slug)
        .single();

      if (data) {
        setJsonMenu(data.json_menu);
        setLanguages(data.languages);
        if (data.languages.includes('en')) {
          setCurrentLang('en');
        } else {
          setCurrentLang(data.languages[0]);
        }
      } else {
        console.error(error);
      }
    }

    fetchData();
  }, [slug]);

  const rows = Array.isArray(jsonMenu)
    ? jsonMenu
    : jsonMenu?.[languages?.[0]]?.map((_, i) => {
        const dish = {};
        const desc = {};

        for (const lang of Object.keys(jsonMenu)) {
          dish[lang] = jsonMenu[lang][i]?.dish ?? '';
          desc[lang] = jsonMenu[lang][i]?.desc ?? '';
        }

        return {
          dish,
          desc,
          price: jsonMenu[languages[0]][i]?.price ?? 0,
        };
      }) || [];

  return (
    <main style={{ maxWidth: 700, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ textAlign: 'center', textTransform: 'uppercase' }}>{currentLang} MENU</h1>

      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
        {languages.map((lang) => (
          <button
            key={lang}
            onClick={() => setCurrentLang(lang)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: currentLang === lang ? '#000' : '#eee',
              color: currentLang === lang ? '#fff' : '#000',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              minWidth: 60,
              textTransform: 'uppercase',
            }}
          >
            {lang}
          </button>
        ))}
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #000' }}>
            <th align="left" style={{ paddingBottom: 8 }}>Dish</th>
            <th align="left" style={{ paddingBottom: 8 }}>Description</th>
            <th align="right" style={{ paddingBottom: 8 }}>Price</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #ddd' }}>
              <td style={{ padding: '12px 8px' }}>{item.dish?.[currentLang]}</td>
              <td style={{ padding: '12px 8px' }}>{item.desc?.[currentLang]}</td>
              <td style={{ padding: '12px 8px', textAlign: 'right' }}>${item.price}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
