/** Max upload size — matches Supabase bucket `file_size_limit` (50 MiB). */
export const MAX_UPLOAD_BYTES = 52_428_800;

const ADMIN_UPLOAD_COOKIE = "admin_upload_auth";

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

export function getAdminUploadSecret(): string | undefined {
  const value = process.env.ADMIN_UPLOAD_SECRET?.trim();
  return value || undefined;
}

/** Production always requires ADMIN_UPLOAD_SECRET; dev allows open upload when unset. */
export function isAdminUploadSecretRequired(): boolean {
  return isProduction();
}

export function extractAdminUploadSecret(
  request: Request,
  formData?: FormData,
): string | null {
  const fromHeader = request.headers.get("x-admin-upload-secret");
  if (fromHeader) return fromHeader;
  if (formData) {
    const fromForm = formData.get("secret");
    if (typeof fromForm === "string" && fromForm.length > 0) return fromForm;
  }
  return null;
}

export type AdminUploadAuthResult =
  | { ok: true }
  | { ok: false; status: 400 | 401 | 429 | 503; message: string };

export function verifyAdminUploadAuth(
  request: Request,
  formData?: FormData,
): AdminUploadAuthResult {
  const expected = getAdminUploadSecret();

  if (isAdminUploadSecretRequired() && !expected) {
    return {
      ok: false,
      status: 503,
      message:
        "프로덕션에서 ADMIN_UPLOAD_SECRET이 설정되지 않아 업로드가 비활성화되어 있습니다. Vercel Environment Variables에 추가한 뒤 재배포하세요.",
    };
  }

  if (!expected) {
    return { ok: true };
  }

  const provided = extractAdminUploadSecret(request, formData);
  if (provided !== expected) {
    return {
      ok: false,
      status: 401,
      message: "업로드 비밀번호가 올바르지 않습니다.",
    };
  }

  return { ok: true };
}

export function adminUploadCookieName(): string {
  return ADMIN_UPLOAD_COOKIE;
}

export function adminUploadCookieValue(): string | undefined {
  return getAdminUploadSecret();
}

const rateBuckets = new Map<string, number[]>();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX_REQUESTS = 5;

/** Best-effort per-instance rate limit (serverless: not global). */
export function checkUploadRateLimit(request: Request): AdminUploadAuthResult {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  const now = Date.now();
  const timestamps = (rateBuckets.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (timestamps.length >= RATE_MAX_REQUESTS) {
    return {
      ok: false,
      status: 429,
      message: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
    };
  }
  timestamps.push(now);
  rateBuckets.set(ip, timestamps);
  return { ok: true };
}

const ALLOWED_TXT_TYPES = new Set([
  "text/plain",
  "text/plain; charset=utf-8",
  "application/octet-stream",
]);

export function validateTxtUpload(file: File): AdminUploadAuthResult {
  if (file.size > MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      status: 400,
      message: `파일 크기는 ${MAX_UPLOAD_BYTES / 1024 / 1024}MB 이하여야 합니다.`,
    };
  }

  const name = file.name.trim();
  const baseName = name.split(/[/\\]/).pop() ?? name;
  if (baseName !== name || name.includes("..")) {
    return {
      ok: false,
      status: 400,
      message: "유효하지 않은 파일 이름입니다.",
    };
  }

  if (!baseName.toLowerCase().endsWith(".txt")) {
    return {
      ok: false,
      status: 400,
      message: "KakaoTalk보내기 .txt 파일만 허용됩니다.",
    };
  }

  const mime = (file.type || "text/plain").toLowerCase();
  if (mime && !ALLOWED_TXT_TYPES.has(mime)) {
    return {
      ok: false,
      status: 400,
      message: "허용되지 않는 Content-Type입니다. text/plain .txt만 업로드할 수 있습니다.",
    };
  }

  return { ok: true };
}
