import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { nanoid } from 'nanoid';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
const openai = new OpenAI();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { items, languages } = req.body as {
    items: { dish: string; desc: string; price: number }[];
    languages: string[];
  };

  const prompt = `
Translate the following JSON menu into: ${languages.join(', ')}.
Return the same JSON keyed by language code.

${JSON.stringify(items)}
`;

  const chat = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 4000
  });

  const translated = JSON.parse(chat.choices[0].message.content!);
  const slug = nanoid(8);

  const { error } = await supabase.from('menus').insert({
    slug, languages, json_menu: translated
  });
  if (error) return res.status(500).json({ error: error.message });

  res.status(200).json({ slug });
}
