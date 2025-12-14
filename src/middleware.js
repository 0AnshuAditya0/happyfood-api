import { NextResponse } from 'next/server';

export function middleware(request) {
    // Add compression headers
    const response = NextResponse.next();
    
    // Enable gzip compression for all responses
    response.headers.set('Content-Encoding', 'gzip');
    response.headers.set('Vary', 'Accept-Encoding');
    
    // Add CORS headers for API routes
    if (request.nextUrl.pathname.startsWith('/api/')) {
        response.headers.set('Access-Control-Allow-Origin', '*');
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }
    
    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
}; 