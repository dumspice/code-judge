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

  // 1. Xử lý khi CHƯA đăng nhập
  if (!token) {
    // Cho phép truy cập trang chủ (/), login, register
    if (pathname === '/' || pathname === '/login' || pathname === '/register') {
      return NextResponse.next()
    }
    // Các route khác tự động redirect về /login
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 2. Giải mã Token lấy thông tin Role
  const decodedToken = decodeJwtPayload(token)
  const userRole = decodedToken?.role || 'CLIENT' 

  // 3. Xử lý khi ĐÃ đăng nhập mà cố vào trang Auth
  if (pathname === '/login' || pathname === '/register') {
    // Phân luồng theo Role
    if (userRole === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin/users', request.url))
    } else {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // 4. Bảo vệ route Admin (Ngăn chặn Client truy cập trái phép)
  if (pathname.startsWith('/admin') && userRole !== 'ADMIN') {
    // Trả về dashboard hoặc trang 403
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Các route khác cho phép truy cập bình thường
  return NextResponse.next()
}

// 5. Cấu hình matcher
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}