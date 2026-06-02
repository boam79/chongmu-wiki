import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { applyApiCors, corsPreflightResponse } from "@/lib/security/cors";
import { verifyRevalidateAuth } from "@/lib/security/revalidate-auth";

const ALLOWED_PATHS = new Set([
  "/dashboard",
  "/activity",
  "/",
  "/vendors",
  "/negotiation",
  "/fleet",
  "/facility",
  "/legal",
  "/hr",
  "/checklist",
  "/ai",
  "/community",
]);

function jsonResponse(
  request: Request,
  body: Record<string, unknown>,
  status: number,
): NextResponse {
  return applyApiCors(request, NextResponse.json(body, { status }));
}

export async function OPTIONS(request: Request) {
  const preflight = corsPreflightResponse(request);
  return preflight ?? new NextResponse(null, { status: 405 });
}

export async function POST(request: Request) {
  const auth = verifyRevalidateAuth(request);
  if (!auth.ok) {
    return jsonResponse(request, { ok: false, message: auth.message }, auth.status);
  }

  let paths: string[] = ["/dashboard", "/activity"];
  try {
    const body = (await request.json()) as { paths?: unknown };
    if (Array.isArray(body.paths)) {
      paths = body.paths.filter((p): p is string => typeof p === "string");
    }
  } catch {
    /* default paths */
  }

  const revalidated: string[] = [];
  for (const path of paths) {
    if (!path.startsWith("/") || path.includes("..")) continue;
    if (!ALLOWED_PATHS.has(path) && !path.match(/^\/[a-z-]+$/)) continue;
    revalidatePath(path);
    revalidated.push(path);
  }

  return jsonResponse(request, { ok: true, revalidated }, 200);
}
