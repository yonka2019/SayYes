import { NextResponse, type NextRequest } from "next/server";
import {
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  localeFromPath,
  resolveLocale,
} from "@/lib/i18n/locales";

/**
 * Puts a locale prefix on every page request. Detection itself lives in
 * `resolveLocale` — this only wires the request to it, so the rules stay unit
 * testable without a server.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookie = request.cookies.get(LOCALE_COOKIE)?.value ?? null;

  if (localeFromPath(pathname).locale) return NextResponse.next();

  const locale = resolveLocale({
    pathname,
    cookie,
    acceptLanguage: request.headers.get("accept-language"),
  });

  const url = request.nextUrl.clone();
  url.pathname = pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;

  const response = NextResponse.redirect(url, 307);
  // Remember a header-negotiated choice so the negotiation runs once, not per nav.
  if (!cookie) {
    response.cookies.set(LOCALE_COOKIE, locale, {
      path: "/",
      maxAge: LOCALE_COOKIE_MAX_AGE,
      sameSite: "lax",
    });
  }
  return response;
}

export const config = {
  // API routes must not be redirected, and static assets have no locale.
  matcher: ["/((?!api|_next/static|_next/image|.*\\.).*)"],
};
