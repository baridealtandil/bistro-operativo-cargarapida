/**
 * Utility functions for date and currency formatting across the app.
 */

export function formatDateDDMMAAAA(dateStr?: string): string {
  if (!dateStr) return '-';
  // Handle ISO string or YYYY-MM-DD
  const cleanStr = dateStr.split('T')[0];
  const parts = cleanStr.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    const [yyyy, mm, dd] = parts;
    return `${dd}/${mm}/${yyyy}`;
  }
  return dateStr;
}

export function formatCurrencyAR(amount: number): string {
  return `$${Math.round(amount).toLocaleString('es-AR')}`;
}
