/**
 * General Formatting Utilities
 */

export function formatCurrency(
  amount: number,
  currency: string = '৳',
  locale: string = 'en-US'
): string {
  try {
    const formatted = Math.abs(amount).toLocaleString(locale);
    const sign = amount < 0 ? '-' : '';
    return `${sign}${formatted} ${currency}`;
  } catch {
    return `${amount} ${currency}`;
  }
}

export function formatDate(
  dateInput: string | Date | number,
  options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  },
  locale: string = 'en-US'
): string {
  try {
    const date = typeof dateInput === 'string' || typeof dateInput === 'number'
      ? new Date(dateInput)
      : dateInput;
    return new Intl.DateTimeFormat(locale, options).format(date);
  } catch {
    return String(dateInput);
  }
}

export function truncate(str: string, maxLength: number = 30): string {
  if (!str || str.length <= maxLength) return str;
  return `${str.slice(0, maxLength)}...`;
}
