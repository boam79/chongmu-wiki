export function getRevalidateSecret(): string | undefined {
  const value =
    process.env.REVALIDATE_SECRET?.trim() ??
    process.env.VERCEL_REVALIDATE_TOKEN?.trim();
  return value || undefined;
}

export function extractRevalidateSecret(request: Request): string | null {
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    return auth.slice(7).trim();
  }
  const header = request.headers.get("x-revalidate-secret");
  if (header) return header.trim();
  const url = new URL(request.url);
  const query = url.searchParams.get("secret");
  if (query) return query.trim();
  return null;
}

export function verifyRevalidateAuth(request: Request):
  | { ok: true; secret: string }
  | { ok: false; status: 401 | 503; message: string } {
  const expected = getRevalidateSecret();
  if (!expected) {
    return {
      ok: false,
      status: 503,
      message:
        "REVALIDATE_SECRET(또는 VERCEL_REVALIDATE_TOKEN)이 설정되지 않았습니다.",
    };
  }

  const provided = extractRevalidateSecret(request);
  if (provided !== expected) {
    return {
      ok: false,
      status: 401,
      message: "Revalidate 인증에 실패했습니다.",
    };
  }

  return { ok: true, secret: expected };
}
