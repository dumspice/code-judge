import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Hàm giải mã JWT cơ bản chạy được trên Edge Runtime
function decodeJwtPayload(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    // Giải mã payload
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get('accessToken')?.value
  const { pathname } = request.nextUrl

  // CHƯA LOGIN
  if (!token) {
    // Public routes
    if (
      pathname === '/' ||
      pathname === '/login' ||
      pathname === '/register'
    ) {
      return NextResponse.next()
    }

    return NextResponse.redirect(new URL('/login', request.url))
  }

  // ĐÃ LOGIN
  const decodedToken = decodeJwtPayload(token)
  const userRole = decodedToken?.role || 'CLIENT'

  // NEW:
  // Nếu user đã login mà vào "/" -> redirect luôn
  if (pathname === '/') {
    if (userRole === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin/users', request.url))
    }

    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Nếu đã login mà cố vào login/register
  if (pathname === '/login' || pathname === '/register') {
    if (userRole === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin/users', request.url))
    }

    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Protect admin routes
  if (pathname.startsWith('/admin') && userRole !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

// 5. Cấu hình matcher
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}