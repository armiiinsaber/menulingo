import { updateSession } from "@/lib/supabase/middleware";
import { type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Run the middleware on every path **except**:
     * - _next/static  (static files)
     * - _next/image   (image optimisation)
     * - favicon / images
     * - api routes
     * - /onboard (public wizard)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/|onboard|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

