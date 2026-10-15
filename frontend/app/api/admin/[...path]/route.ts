import { NextResponse, type NextRequest } from "next/server";

import { API_PREFIX, API_URL } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SESSION_COOKIE = "sp_admin_session";
const CSRF_COOKIE = "sp_admin_csrf";
const COOKIE_LIFETIME = 60 * 60 * 24 * 14;
const allowedResources = new Set([
  "sports",
  "countries",
  "competitions",
  "seasons",
  "rounds",
  "users",
  "login-history",
]);
const allowedAuthActions = new Set(["csrf", "login", "logout", "session"]);

function isAllowedPath(path: string[]): boolean {
  if (path.length === 2 && path[0] === "auth") {
    return allowedAuthActions.has(path[1]);
  }

  return (
    (path.length === 1 || path.length === 2) &&
    allowedResources.has(path[0]) &&
    (path.length === 1 ||
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        path[1]
      ))
  );
}

function cookieValue(response: Response, name: string): string | undefined {
  const cookies = response.headers.getSetCookie?.() ?? [];
  const prefix = `${name}=`;
  for (const cookie of cookies) {
    const firstPart = cookie.split(";", 1)[0];
    if (firstPart.startsWith(prefix)) return firstPart.slice(prefix.length);
  }

  return undefined;
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

async function proxyAdminRequest(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  if (!isAllowedPath(path)) {
    return NextResponse.json({ message: "Route d’administration inconnue." }, { status: 404 });
  }

  const method = request.method;
  const session = request.cookies.get(SESSION_COOKIE)?.value;
  const csrf = request.cookies.get(CSRF_COOKIE)?.value;
  const headers = new Headers({
    Accept: "application/json",
    Origin: new URL(API_URL).origin,
  });

  if (session || csrf) {
    headers.set(
      "Cookie",
      [
        session ? `sessionid=${session}` : "",
        csrf ? `csrftoken=${csrf}` : "",
      ]
        .filter(Boolean)
        .join("; ")
    );
  }

  const csrfHeader = request.headers.get("x-csrftoken");
  if (csrfHeader) headers.set("X-CSRFToken", csrfHeader);
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);

  let body: string | undefined;
  if (method !== "GET" && method !== "HEAD") {
    body = await request.text();
  }

  let upstream: Response;
  try {
    const target = new URL(
      `${API_PREFIX}/admin/${path.join("/")}/`,
      `${API_URL}/`
    );
    target.search = request.nextUrl.search;
    upstream = await fetch(target, {
      method,
      headers,
      body,
      cache: "no-store",
      redirect: "manual",
    });
  } catch {
    return NextResponse.json(
      { message: "Le service d’administration est injoignable." },
      { status: 503 }
    );
  }

  const responseText = await upstream.text();
  let payload: unknown = null;
  if (responseText) {
    try {
      payload = JSON.parse(responseText);
    } catch {
      payload = {
        message:
          upstream.status >= 500
            ? "Le service d’administration a rencontré une erreur."
            : "Requête refusée par le service d’administration.",
      };
    }
  }

  const response =
    upstream.status === 204
      ? new NextResponse(null, { status: 204 })
      : NextResponse.json(payload, { status: upstream.status });

  const sessionValue = cookieValue(upstream, "sessionid");
  const csrfValue = cookieValue(upstream, "csrftoken");
  if (sessionValue) {
    response.cookies.set(
      SESSION_COOKIE,
      sessionValue,
      cookieOptions(COOKIE_LIFETIME)
    );
  }
  if (csrfValue) {
    response.cookies.set(CSRF_COOKIE, csrfValue, cookieOptions(COOKIE_LIFETIME));
  }
  if (path[0] === "auth" && path[1] === "logout" && upstream.ok) {
    response.cookies.set(SESSION_COOKIE, "", cookieOptions(0));
    response.cookies.set(CSRF_COOKIE, "", cookieOptions(0));
  }

  return response;
}

export const GET = proxyAdminRequest;
export const POST = proxyAdminRequest;
export const PUT = proxyAdminRequest;
export const PATCH = proxyAdminRequest;
export const DELETE = proxyAdminRequest;
