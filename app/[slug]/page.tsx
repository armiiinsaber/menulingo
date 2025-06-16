/* eslint-disable */

import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';

/** Force this route to run on the server at request-time */
export const dynamic = 'force-dynamic';

export default async function Page({
  params,
}: {
  params: { slug: string };
}) {
  /* ---------- fetch the menu row ---------- */
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

  /* ---------- show first language (*
