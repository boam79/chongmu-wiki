import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  adminUploadCookieName,
  getAdminUploadSecret,
  isAdminUploadSecretRequired,
} from "@/lib/security/admin-upload";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  if (isAdminUploadSecretRequired() && !getAdminUploadSecret()) {
    return new NextResponse(
      "Admin area disabled: set ADMIN_UPLOAD_SECRET on the server.",
      { status: 503 },
    );
  }

  const secret = getAdminUploadSecret();
  if (!secret) {
    return NextResponse.next();
  }

  const provided =
    request.cookies.get(adminUploadCookieName())?.value ??
    request.headers.get("x-admin-upload-secret");

  if (provided === secret) {
    return NextResponse.next();
  }

  if (pathname === "/admin/upload" || pathname.startsWith("/admin/upload/")) {
    return NextResponse.next();
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/admin/upload";
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*"],
};
