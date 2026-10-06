import { z } from 'zod';

export const envSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    MONGODB_URI: z
      .string()
      .regex(/^mongodb(\+srv)?:\/\//, 'Must be a MongoDB connection string'),
    ENABLE_SWAGGER: z.stringbool().default(false),
    TELEGRAM_BOT_TOKEN: z.string().min(1).optional(),
    // Comma-separated storefront origins allowed to call the API from a browser
    CORS_ORIGINS: z
      .string()
      .default('http://localhost:3001')
      .transform((value) =>
        value
          .split(',')
          .map((origin) => origin.trim())
          .filter(Boolean),
      ),
  })
  .refine((env) => env.NODE_ENV !== 'production' || env.TELEGRAM_BOT_TOKEN, {
    message: 'TELEGRAM_BOT_TOKEN is required in production',
    path: ['TELEGRAM_BOT_TOKEN'],
  });

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    throw new Error(
      `Invalid environment variables:\n${z.prettifyError(result.error)}`,
    );
  }
  return result.data;
}
