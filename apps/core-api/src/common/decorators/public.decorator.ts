import { SetMetadata } from '@nestjs/common';
import { IS_PUBLIC_KEY } from '../constants/auth.constants';

/** Đánh dấu route không cần JWT (dùng khi đã bật `JwtAuthGuard` toàn cục). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
