import { updateSession } from "@/lib/supabase/middleware";
import { type NextRequest } from "next/server";

/** Refresh Supabase session cookies on every request that still
 *  needs authentication (currently only the future /dashboard area). */
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // 👉  Run this middleware ONLY on /dashboard and anything beneath it.
  matcher: ["/dashboard/:path*"],
};
