import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Định dạng tiền VND nguyên an toàn (Int64), có dấu phân cách hàng nghìn
 */
export function formatVND(amount: number): string {
  if (isNaN(amount) || !isFinite(amount)) return '0 đ';
  const integerAmount = Math.round(amount);
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(integerAmount);
}

/**
 * Định dạng ngày giờ chuẩn Việt Nam (Asia/Ho_Chi_Minh)
 */
export function formatDateTime(date: string | Date | undefined | null): string {
  if (!date) return '--/--/----';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '--/--/----';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

/**
 * Định dạng ngày YYYY-MM-DD
 */
export function formatDateOnly(date: string | Date): string {
  const d = new Date(date);
  return d.toISOString().slice(0, 10);
}

/**
 * Sinh khóa Idempotency Key duy nhất cho các hành động thay đổi dữ liệu
 */
export function generateIdempotencyKey(prefix = 'WEB'): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 9);
  return `${prefix}-${ts}-${rand}`;
}
