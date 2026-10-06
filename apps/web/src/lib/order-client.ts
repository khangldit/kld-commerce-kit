import {
  apiErrorSchema,
  orderResponseSchema,
  type ApiError,
  type CreateOrderRequestInput,
  type OrderResponse,
} from '@kld/shared';
import { getApiUrl } from '@/config/store';

// Render free tier cold starts take 30–60s; give the first request room.
const ORDER_TIMEOUT_MS = 75_000;

export type SubmitResult =
  | { ok: true; order: OrderResponse }
  | { ok: false; kind: 'api'; error: ApiError }
  | { ok: false; kind: 'network' };

export async function submitOrder(
  storeSlug: string,
  body: CreateOrderRequestInput,
): Promise<SubmitResult> {
  let response: Response;
  try {
    response = await fetch(
      `${getApiUrl()}/stores/${encodeURIComponent(storeSlug)}/orders`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(ORDER_TIMEOUT_MS),
      },
    );
  } catch {
    return { ok: false, kind: 'network' };
  }

  const json: unknown = await response.json().catch(() => null);
  if (response.ok) {
    const parsed = orderResponseSchema.safeParse(json);
    // The order exists even if the body is unexpected; the idempotency key
    // makes a retry return the same order.
    return parsed.success
      ? { ok: true, order: parsed.data }
      : { ok: false, kind: 'network' };
  }

  const error = apiErrorSchema.safeParse(json);
  if (error.success) return { ok: false, kind: 'api', error: error.data };
  return { ok: false, kind: 'network' };
}

/** Wake the API early (Render free tier sleeps after 15 minutes idle). */
export function warmUpApi(): void {
  fetch(`${getApiUrl()}/health`, { cache: 'no-store' }).catch(() => {});
}

/** `details` of a PRODUCTS_UNAVAILABLE error. */
export function unavailableProductIds(error: ApiError): string[] {
  const details = error.details as { unavailableProductIds?: unknown } | null;
  return Array.isArray(details?.unavailableProductIds)
    ? details.unavailableProductIds.filter(
        (id): id is string => typeof id === 'string',
      )
    : [];
}

/** `details` of a VALIDATION_FAILED error → field names that failed. */
export function invalidFields(error: ApiError): Set<string> {
  const details = Array.isArray(error.details) ? error.details : [];
  return new Set(
    details
      .map((issue: { path?: unknown }) =>
        typeof issue?.path === 'string' ? issue.path.split('.')[0] : '',
      )
      .filter(Boolean),
  );
}
