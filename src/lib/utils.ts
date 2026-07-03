const ones = [
  '', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE',
  'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN',
  'SEVENTEEN', 'EIGHTEEN', 'NINETEEN',
];
const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];

function twoDigits(n: number): string {
  if (n < 20) return ones[n];
  return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
}

function threeDigits(n: number): string {
  if (n === 0) return '';
  if (n < 100) return twoDigits(n);
  return ones[Math.floor(n / 100)] + ' HUNDRED' + (n % 100 !== 0 ? ' ' + twoDigits(n % 100) : '');
}

export function numberToWords(amount: number): string {
  if (amount === 0) return 'ZERO RUPEES';
  if (isNaN(amount) || !isFinite(amount)) return 'ZERO RUPEES';

  const rounded = Math.round(amount * 100) / 100;
  const intPart = Math.floor(rounded);
  const decPart = Math.round((rounded - intPart) * 100);

  let result = '';
  const crore = Math.floor(intPart / 10000000);
  const lakh = Math.floor((intPart % 10000000) / 100000);
  const thousand = Math.floor((intPart % 100000) / 1000);
  const hundred = intPart % 1000;

  if (crore > 0) result += threeDigits(crore) + ' CRORE ';
  if (lakh > 0) result += threeDigits(lakh) + ' LAKH ';
  if (thousand > 0) result += threeDigits(thousand) + ' THOUSAND ';
  if (hundred > 0) result += threeDigits(hundred);

  result = result.trim();
  if (decPart > 0) {
    result += ' RUPEES AND ' + twoDigits(decPart) + ' PAISE';
  } else {
    result += ' RUPEES';
  }
  return result.trim();
}

export function sanitizeText(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2013/g, '-')
    .replace(/\u2014/g, '--')
    .replace(/\u2026/g, '...')
    .replace(/[^\x00-\x7F]/g, '?');
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}
