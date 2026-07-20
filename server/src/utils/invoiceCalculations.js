export function calculateInvoice(rate, ctc, isIntraState, taxes) {
  const amount = rate < 1 ? Math.round(rate * ctc) : rate;
  const cgst = isIntraState ? amount * taxes.cgstRate : 0;
  const sgst = isIntraState ? amount * taxes.sgstRate : 0;
  const igst = isIntraState ? 0 : amount * taxes.igstRate;
  return { amount, cgst, sgst, igst, total: Math.round(amount + cgst + sgst + igst) };
}
