/**
 * MENTOR: Typed API errors — screens map fieldErrors into react-hook-form setError.
 */

export type ApiFieldError = {
  path: string;
  message: string;
};

export class ApiError extends Error {
  readonly statusCode: number;
  readonly fieldErrors: ApiFieldError[];
  readonly code?: 'PENDING_VERIFICATION';

  constructor(opts: {
    message: string;
    statusCode: number;
    fieldErrors?: ApiFieldError[];
    code?: 'PENDING_VERIFICATION';
  }) {
    super(opts.message);
    this.name = 'ApiError';
    this.statusCode = opts.statusCode;
    this.fieldErrors = opts.fieldErrors ?? [];
    this.code = opts.code;
  }
}

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong.') {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}

export function isPendingVerificationError(error: unknown) {
  return error instanceof ApiError && error.code === 'PENDING_VERIFICATION';
}

/** Map backend errorMessages[].path onto RHF fields when path is a known form key. */
export function applyApiFieldErrors(
  // RHF UseFormSetError is generic; accept a loose setter to avoid field-name friction.
  setError: (name: any, error: { type: string; message: string }) => void,
  error: unknown,
  allowedFields: string[],
) {
  if (!(error instanceof ApiError)) return;
  for (const item of error.fieldErrors) {
    const key = item.path?.replace(/^body\./, '').split('.').pop() ?? '';
    if (key && allowedFields.includes(key)) {
      setError(key, { type: 'server', message: item.message });
    }
  }
}
