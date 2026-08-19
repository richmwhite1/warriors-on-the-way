import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — must call getUser() not getSession() for security
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Protect authenticated routes
  const protectedPrefixes = ["/home", "/community", "/events", "/me", "/profile", "/topics"];
  const isProtected = protectedPrefixes.some((p) => pathname.startsWith(p));

  // Allow guests to view shared invite links and their OG images, so a link dropped
  // in a group chat previews and offers a join path — not a login wall. Covers event
  // detail pages and the community detail root (+ its opengraph-image), but NOT the
  // /community index or admin sub-routes (members/settings/moderation), which stay gated.
  const isGuestViewable =
    /^\/community\/[^/]+\/events\/[^/]+/.test(pathname) ||
    /^\/community\/[^/]+(\/opengraph-image)?$/.test(pathname);

  if (isProtected && !isGuestViewable && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    return NextResponse.redirect(url);
  }

  // Redirect signed-in users away from sign-in
  if (pathname === "/sign-in" && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/home";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
