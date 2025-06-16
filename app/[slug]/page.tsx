import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';

export default async function MenuPage({ params }: { params: { slug: string } }) {
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
    json_menu: any[];
    languages: string[];
  };

  const lang = languages[0] ?? 'en'; // default

  return (
    <div style={{maxWidth:600,margin:'40px auto',fontFamily:'sans-serif'}}>
      <select
        defaultValue={lang}
        onChange={(e)=>location.search='?lang='+e.target.value}
        style={{fontSize:18,marginBottom:20}}
      >
        {languages.map(l=>(
          <option key={l} value={l}>{l.toUpperCase()}</option>
        ))}
      </select>

      {json_menu.map((it,i)=>(
        <div key={i} style={{margin:'12px 0'}}>
          <strong>{it.dish[lang]}</strong>
          <span style={{float:'right'}}>${it.price}</span><br/>
          <small>{it.desc[lang]}</small>
        </div>
      ))}
    </div>
  );
}
