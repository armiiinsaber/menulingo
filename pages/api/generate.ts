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
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content:
          'You are a culinary translator. When you answer, ' +
          'return ONLY valid JSON — no markdown, no code block, no commentary.'
      },
      { role: 'user', content: prompt }
    ],
    response_format: { type: 'json_object' }   // <-- forces valid JSON
  });

