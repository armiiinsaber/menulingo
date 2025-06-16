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
    .select('json_m_
