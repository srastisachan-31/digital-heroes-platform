import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request) {
  return await updateSession(request);
}

export const config = {
  // Static files (images, _next) ko chhodkar baaki sab routes par chalao
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};