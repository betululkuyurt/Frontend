import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// JWT token validation function
function isValidToken(token: string): boolean {
  try {
    // Split the token and get the payload
    const payload = JSON.parse(atob(token.split(".")[1]));
    
    // Check if token is expired
    const currentTime = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < currentTime) {
      return false;
    }
    
    // Check if token has required fields
    if (!payload.sub || !payload.email) {
      return false;
    }
    
    return true;
  } catch (e) {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const protectedPaths = [
    "/apps",
    "/settings",
    "/profile",
    "/apps/api-keys",
    "/apps/create/service-workflow-builder",
  ];
  
  // Exceptions - paths that start with protected routes but should be publicly accessible
  const publicExceptions = [
    "/apps/create/service-workflow-builder/documentation",
  ];
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get("accessToken")?.value;
  const userId = request.cookies.get("user_id")?.value;
  
  // Check if the current path is in the exceptions list
  const isPublicException = publicExceptions.some(path => pathname.startsWith(path));
  
  // Only consider a route protected if it's in the protected paths AND not in the exceptions
  const isProtectedRoute = protectedPaths.some((path) =>
    pathname.startsWith(path)
  ) && !isPublicException;

  // Ana sayfa kontrolü
  if (pathname === "/" && accessToken && isValidToken(accessToken)) {
    return NextResponse.redirect(new URL("/apps", request.url));
  }

  // Auth sayfaları kontrolü (login/register)
  if (pathname.startsWith("/auth/") && accessToken && isValidToken(accessToken)) {
    return NextResponse.redirect(new URL("/apps", request.url));
  }

  // Korumalı rotalar kontrolü
  if (isProtectedRoute) {
    if (!accessToken || !isValidToken(accessToken) || !userId) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      
      // Geçersiz token veya user_id varsa temizle
      const response = NextResponse.redirect(loginUrl);
      if (accessToken && !isValidToken(accessToken)) {
        response.cookies.delete("accessToken");
        response.cookies.delete("user_id");
      }
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
