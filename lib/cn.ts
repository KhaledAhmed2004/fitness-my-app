/**
 * MENTOR: Tiny className merger for conditional NativeWind classes.
 * Prefer this over string concatenation: cn('base', error && 'border-danger')
 */
export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}
