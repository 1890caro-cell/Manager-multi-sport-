/**
 * Tiện ích định dạng tiền tệ và thời gian cho ứng dụng di động Antigravity
 * Tuân thủ Rule 00-invariants.md: Tiền tệ luôn là số nguyên an toàn VND (Safe Integer)
 */

export function formatVND(amount: number): string {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) {
    return '0 đ';
  }
  // Safe Integer VND formatting with dots separator
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
  return `${hours}:${minutes} ${day}/${month}/${year}`;
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
  return `${hours}:${minutes}`;
}
