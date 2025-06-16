import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Onboard() {
  const router = useRouter();
  const [raw, setRaw] = useState('');
  const [langs, setLangs] = useState<string[]>(['fr', 'es']);
  const [loading, setLoading] = useState(false);

  const handleGo = async () => {
    if (!raw) return;
    setLoading(true);
    const items = raw.split('\n').filter(Boolean).map(l => {
      const [dish, desc, price] = l.split('|').map(x => x.trim());
      return { dish, desc, price: Number(price) };
    });
    const r = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ items, languages: langs })
    }).then(r => r.json());
    router.push('/' + r.slug);     // we’ll create this reader page next
  };

  return (
    <main style={{maxWidth:600,margin:'40px auto',fontFamily:'sans-serif'}}>
      <h2>QR-Menu Builder</h2>

      <label>1. Paste each line (“dish | description | price”)</label>
      <textarea rows={6} style={{width:'100%'}}
                value={raw} onChange={e=>setRaw(e.target.value)} />

      <label style={{display:'block',marginTop:20}}>2. Choose languages</label>
      {['fr','es','de','it','zh'].map(l=>(
        <label key={l} style={{marginRight:12}}>
          <input type="checkbox" checked={langs.includes(l)}
            onChange={()=>setLangs(s=>s.includes(l)?s.filter(x=>x!==l):[...s,l])}/>
          {l.toUpperCase()}
        </label>
      ))}

      <button onClick={handleGo} disabled={loading||!raw}
              style={{marginTop:30,padding:'10px 24px',fontSize:16}}>
        {loading ? 'Working…' : 'Generate QR'}
      </button>
    </main>
  );
}
