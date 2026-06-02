import { NextResponse } from "next/server";

function allowedOrigins(): string[] {
  const origins = new Set<string>();
  const projectUrl = process.env.VERCEL_PROJECT_URL?.trim();
  if (projectUrl) {
    origins.add(projectUrl.startsWith("http") ? projectUrl : `https://${projectUrl}`);
  }
  origins.add("http://localhost:3000");
  origins.add("http://127.0.0.1:3000");
  return [...origins];
}

export function applyApiCors(request: Request, response: NextResponse): NextResponse {
  const origin = request.headers.get("origin");
  if (!origin) return response;

  const allowed = allowedOrigins();
  if (!allowed.includes(origin)) {
    return response;
  }

  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, x-admin-upload-secret",
  );
  response.headers.set("Vary", "Origin");
  return response;
}

export function corsPreflightResponse(request: Request): NextResponse | null {
  if (request.method !== "OPTIONS") return null;
  const response = new NextResponse(null, { status: 204 });
  return applyApiCors(request, response);
}
