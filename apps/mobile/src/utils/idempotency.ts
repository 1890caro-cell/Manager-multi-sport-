/**
 * Sinh khóa Idempotency duy nhất cho các tác vụ di động (đặt sân, nạp tiền, hủy đơn)
 */
export function generateIdempotencyKey(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 10);
  return `mob-${timestamp}-${randomStr}`;
}
