/**
 * Utility functions for date and currency formatting across the app.
 */

export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

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
