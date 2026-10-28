/**
 * Lớp lỗi DomainError chuẩn cho toàn hệ thống
 * Tuân thủ quy ước ADR-0001 và Rule backend-nestjs:
 * - Mã lỗi (code) ổn định dạng SCREAMING_SNAKE (vd: SLOT_TAKEN, WALLET_INSUFFICIENT)
 * - Tự động được ProblemDetailsFilter chuyển thành RFC 7807 (application/problem+json)
 */
export class DomainError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly httpStatus: number = 409,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'DomainError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
