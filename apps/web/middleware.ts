import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Lưu accessToken vào cookie
  const token = request.cookies.get('accessToken')?.value
  const { pathname } = request.nextUrl

  // 1 & 2. Xử lý khi CHƯA đăng nhập
  if (!token) {
    // Cho phép truy cập trang chủ (/), trang đăng nhập (/login) và đăng ký (/register)
    if (pathname === '/' || pathname === '/login' || pathname === '/register') {
      return NextResponse.next()
    }
    // Các route khác tự động redirect về /login
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 3. Xử lý khi ĐÃ đăng nhập
  // Nếu cố truy cập vào /login hoặc /register, tự động redirect về /dashboard
  if (pathname === '/login' || pathname === '/register') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Các route khác cho phép truy cập bình thường
  return NextResponse.next()
}

// 4. Cấu hình matcher để bảo vệ các route cần thiết
export const config = {
  matcher: [
    /*
     * Match tất cả request paths ngoại trừ:
     * - api (API routes)
     * - _next/static (các file tĩnh)
     * - _next/image (các file ảnh đã được tối ưu)
     * - favicon.ico (favicon)
     * - và các file có extension thông dụng (nếu cần thiết có thể mở rộng thêm)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
