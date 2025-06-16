import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { nanoid } from 'nanoid';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const openai = new OpenAI();

/**
 * POST /api/generate
 * Body: { items: [{dish,desc,price}], languages: ["fr","es"] }
 * Returns: { slug }  –  slug is the URL segment diners will scan
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') return res.status(405).end();

  const { items, languages } = req.body as {
    items: { dish: string; desc: string; price: number }[];
    languages: string[];
  };

  /* ---------- prompt GPT to translate ---------- */
  const prompt = `
Translate the following JSON menu into: ${languages.join(', ')}.
Return ONLY valid JSON with the same shape, keyed by language code (no markdown).

${JSON.stringify(items)}
`;

  const chat = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content:
          'You are a culinary translator. Respond ONLY with pure JSON—no code block or extra text.'
      },
      { role: 'user', content: prompt }
    ],
    response_format: { type: 'json_object' } // forces valid JSON
  });

  /* ---------- parse and store ---------- */
  const translated = JSON.parse(chat.choices[0].message.content!);
  const slug = nanoid(8);

  const { error } = await supabase
    .from('menus')
    .insert({ slug, languages, json_menu: translated });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.status(200).json({ slug });
}
