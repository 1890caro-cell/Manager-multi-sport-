import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Tiền VND an toàn (Safe Integer - SPEC 00-invariants.md)
 */
export function formatVND(amount: number): string {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) {
    return '0 đ';
  }
  const rounded = Math.round(amount);
  return `${rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')} đ`;
}

export function formatDateTime(dateStr: string | Date): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds} ${day}/${month}/${year}`;
}

export function formatDateOnly(dateStr: string | Date): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatTimeOnly(dateStr: string | Date): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

export function formatSlotTimeRange(slots: number[]): string {
  if (!slots || slots.length === 0) return 'Chưa chọn giờ';
  const sorted = [...slots].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];

  const startH = Math.floor(min / 2).toString().padStart(2, '0');
  const startM = (min % 2 === 1 ? '30' : '00');

  const endH = Math.floor((max + 1) / 2).toString().padStart(2, '0');
  const endM = ((max + 1) % 2 === 1 ? '30' : '00');

  return `${startH}:${startM} - ${endH}:${endM} (${slots.length * 30} phút)`;
}

export function generateIdempotencyKey(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 10);
  return `pos-${timestamp}-${randomStr}`;
}
