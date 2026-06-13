const DEFAULT_LOCALE = 'en-US';
const DEFAULT_TIMEZONE = 'Asia/Yangon';

function formatDateValue(value: string | Date, options?: Intl.DateTimeFormatOptions, locale = DEFAULT_LOCALE) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat(locale, {
    timeZone: DEFAULT_TIMEZONE,
    ...options,
  }).format(date);
}

export function formatDateString(value: string | Date, options?: Intl.DateTimeFormatOptions) {
  return formatDateValue(value, options);
}

export function formatTimeString(value: string | Date, options?: Intl.DateTimeFormatOptions) {
  return formatDateValue(value, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    ...options,
  });
}
