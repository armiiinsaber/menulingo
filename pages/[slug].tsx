import { GetServerSideProps } from 'next';
import { createClient } from '@supabase/supabase-js';
import { useState } from 'react';

type MenuItem = { dish: Record<string,string>; desc: Record<string,string>; price: number };

export default function MenuPage({
  menu,
  languages
}: {
  menu: MenuItem[];
  languages: string[];
}) {
  const [lang, setLang] = useState(languages[0] ?? 'en');

  if (!menu?.length) return <h2 style={{textAlign:'center'}}>Menu not found</h2>;

  return (
    <main style={{maxWidth:600,margin:'40px auto',fontFamily:'sans-serif'}}>
      <select value={lang} onChange={e=>setLang(e.target.value)}
              style={{fontSize:18,marginBottom:20}}>
        {languages.map(l=>(
          <option key={l} value={l}>{l.toUpperCase()}</option>
        ))}
      </select>

      {menu.map((it,i)=>(
        <div key={i} style={{margin:'12px 0'}}>
          <strong>{it.dish[lang]}</strong>
          <span style={{float:'right'}}>${it.price}</span><br/>
          <small>{it.desc[lang]}</small>
        </div>
      ))}
    </main>
  );
}

/* ---------- server-side fetch ---------- */
export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data, error } = await supabase
    .from('menus')
    .select('json_menu,languages')
    .eq('slug', params!.slug)
    .single();

  if (error || !data)
    return { notFound: true };

  return {
    props: {
      menu: data.json_menu,
      languages: data.languages
    }
  };
};
