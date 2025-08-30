import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequestWithAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    // Define public routes (accessible without authentication)
    const publicRoutes = ["/landing", "/login", "/signup"];

    // Define protected routes (require authentication)
    const protectedRoutes = ["/dashboard"];

    // If user is authenticated
    if (token) {
      // Redirect authenticated users away from public routes to dashboard
      if (publicRoutes.includes(pathname)) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }

      // Allow access to root (will redirect to dashboard)
      if (pathname === "/") {
        return NextResponse.next();
      }

      // Allow access to protected routes and API routes
      if (protectedRoutes.includes(pathname) || pathname.startsWith("/api/")) {
        return NextResponse.next();
      }

      // Redirect to dashboard for any other routes
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // If user is not authenticated
    if (!token) {
      // Allow access to public routes
      if (publicRoutes.includes(pathname)) {
        return NextResponse.next();
      }

      // Allow access to root (will redirect to landing)
      if (pathname === "/") {
        return NextResponse.next();
      }

      // Allow access to NextAuth API routes
      if (pathname.startsWith("/api/auth/")) {
        return NextResponse.next();
      }

      // Allow access to register API
      if (pathname === "/api/register") {
        return NextResponse.next();
      }

      // Redirect unauthenticated users to landing page for any other routes
      return NextResponse.redirect(new URL("/landing", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Always allow access to public API routes
        if (pathname.startsWith("/api/auth/") || pathname === "/api/register") {
          return true;
        }

        // For all other API routes, require authentication
        if (pathname.startsWith("/api/")) {
          return !!token;
        }

        // For page routes, let the middleware function handle the logic
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets (images, icons, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
