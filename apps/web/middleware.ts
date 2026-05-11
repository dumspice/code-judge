import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Thay đổi: Kiểm tra 'refreshToken' thay vì 'access_token'
  // Backend NestJS chỉ lưu refreshToken vào cookie, accessToken chỉ nằm trên bộ nhớ (RAM)
  const token = request.cookies.get('refreshToken')?.value
  const { pathname } = request.nextUrl

  // 1 & 2. Xử lý khi CHƯA đăng nhập
  if (!token) {
    // Chỉ cho phép truy cập trang chủ (/) và trang đăng nhập (/login)
    if (pathname === '/' || pathname === '/login') {
      return NextResponse.next()
    }
    // Các route khác tự động redirect về /login
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 3. Xử lý khi ĐÃ đăng nhập
  // Nếu cố truy cập vào /login, tự động redirect về /dashboard
  if (pathname === '/login') {
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
