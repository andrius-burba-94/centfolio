import "server-only";

type PbErrorShape = {
  status?: number;
  response?: {
    data?: Record<string, unknown>;
    message?: string;
  };
};

/**
 * Translate a thrown PocketBase ClientResponseError into a user-readable
 * message. Surfaces field-level validation errors from response.data when
 * available; falls back to the provided message otherwise.
 *
 * Without this, every 400 surfaces as the same generic message, hiding the
 * actual validation reason behind a Sentry round-trip.
 */
export function pbErrorMessage(err: unknown, fallback: string): string {
  const pbErr = err as PbErrorShape;
  if (pbErr.status !== 400) return fallback;

  const data = pbErr.response?.data;
  if (data && Object.keys(data).length > 0) {
    const fieldMessages = Object.entries(data)
      .map(([field, raw]) => {
        const message = (raw as { message?: string } | undefined)?.message;
        return message ? `${field}: ${message}` : field;
      })
      .join("; ");
    return `${fallback} (${fieldMessages})`;
  }

  const message = pbErr.response?.message;
  if (message && message !== "Failed to create record.") {
    return `${fallback} (${message})`;
  }

  return fallback;
}
