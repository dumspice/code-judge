/**
 * Quy ước đặt tên room Socket.io cho realtime theo user.
 *
 * Prefix `user:` tránh trùng với các room khác (vd: contest, class).
 */
export const SOCKET_USER_ROOM_PREFIX = 'user:' as const;

/**
 * Trả về tên room Socket.io cho một userId.
 * @param userId - định danh người dùng (phải là chuỗi không rỗng ở tầng business).
 */
export function socketUserRoom(userId: string): string {
  return `${SOCKET_USER_ROOM_PREFIX}${userId}`;
}
