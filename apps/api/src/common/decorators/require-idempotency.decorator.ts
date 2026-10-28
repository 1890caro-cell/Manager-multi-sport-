import { SetMetadata } from '@nestjs/common';

export const REQUIRE_IDEMPOTENCY_KEY = 'REQUIRE_IDEMPOTENCY';

/**
 * Decorator đánh dấu endpoint bắt buộc phải có header `Idempotency-Key`
 */
export const RequireIdempotency = () => SetMetadata(REQUIRE_IDEMPOTENCY_KEY, true);
