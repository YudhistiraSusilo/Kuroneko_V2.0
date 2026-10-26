export function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateValue, language = 'en') {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';

  const locale = { en: 'en-ID', id: 'id-ID', ja: 'ja-JP' }[language] || 'en-ID';
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}
