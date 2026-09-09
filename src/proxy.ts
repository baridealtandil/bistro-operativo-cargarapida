import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  // Manejo de cierre de sesión
  if (request.nextUrl.searchParams.has('logout') || request.nextUrl.pathname === '/api/logout') {
    const response = NextResponse.redirect(new URL('/', request.url));
    response.cookies.delete('app_authenticated');
    response.cookies.delete('login_role');
    return response;
  }

  // Dejar pasar la navegación para que la app React controle nativamente la pantalla de PIN
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|cantina-pink-logo.png).*)',
  ],
};
