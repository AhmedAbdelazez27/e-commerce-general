/** ERP currency codes include legacy two-letter codes such as JD. */
export function isValidCurrencyCode(code: string): boolean {
  return /^[A-Z]{2,3}$/.test(code.trim().toUpperCase());
}
