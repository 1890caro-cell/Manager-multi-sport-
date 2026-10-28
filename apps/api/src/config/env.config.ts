import { z } from 'zod';
import * as dotenv from 'dotenv';

dotenv.config();

export const EnvSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/sports_complex?replicaSet=rs0'),
  REDIS_URL: z.string().optional(),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional().default(''),
  REDIS_TLS: z.coerce.boolean().default(false),
  JWT_SECRET: z.string().default('development_jwt_secret_key_32_characters_minimum'),
  JWT_EXPIRES_IN: z.string().default('1d'),
  IDEMPOTENCY_TTL_SECONDS: z.coerce.number().default(86400),
  PAYOS_CLIENT_ID: z.string().optional(),
  PAYOS_API_KEY: z.string().optional(),
  PAYOS_CHECKSUM_KEY: z.string().optional(),
});

export type EnvConfig = z.infer<typeof EnvSchema>;

export function validateEnv(): EnvConfig {
  const result = EnvSchema.safeParse(process.env);
  if (!result.success) {
    const errorDetails = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    throw new Error(`Environment validation failed: ${errorDetails}`);
  }
  return result.data;
}

export const env = validateEnv();
