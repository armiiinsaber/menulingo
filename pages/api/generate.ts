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
 * Body: {
 *   items: [{ dish:string; desc:string; price:number }],
 *   languages: string[]
 * }
 * Returns: { slug: string }
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

  /* ---------- build prompt ---------- */
  const prompt = `
Translate the following JSON menu into: ${languages.join(', ')}.
Return ONLY valid JSON with identical shape, keyed by language code.

${JSON.stringify(items)}
`;

  /* ---------- call OpenAI ---------- */
  const chat = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content:
          'You are a culinary translator. Respond ONLY with raw JSON—no markdown, no commentary.'
      },
      { role: 'user', content: prompt }
    ],
    response_format: { type: 'json_object' } // forces JSON mode
  });

  /* ---------- robust JSON extraction ---------- */
  let content = (chat.choices[0].message.content ?? '').trim();

  if (!content.startsWith('{')) {
    const first = content.indexOf('{');
    const last = content.lastIndexOf('}');
    if (first !== -1 && last !== -1) content = content.slice(first, last + 1);
  }

  let translated: unknown;
  try {
    translated = JSON.parse(content);
  } catch (parseErr) {
    console.error('generate-parse-error:', parseErr);
    return res
      .status(500)
      .json({ error: 'Invalid JSON from OpenAI', detail: String(parseErr).slice(0, 120) });
  }

  /* ---------- store in Supabase ---------- */
  const slug = nanoid(8);

  const { error } = await supabase
    .from('menus')
    .insert({ slug, languages, json_menu: translated });

  if (error) {
    console.error('supabase-insert-error:', error.message);
    return res.status(500).json({ error: error.message });
  }

  res.status(200).json({ slug });
}

