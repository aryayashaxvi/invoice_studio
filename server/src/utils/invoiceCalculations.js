export function calculateInvoice(
  pricingType,
  value,
  ctc,
  isIntraState,
  taxes
) {
  const numericValue = Number(value);
  const numericCtc = Number(ctc);

  const amount =
    pricingType === 'percentage'
      ? Math.round(numericValue * numericCtc)
      : Math.round(numericValue);

  const cgst = isIntraState
    ? Math.round(amount * Number(taxes.cgstRate))
    : 0;

  const sgst = isIntraState
    ? Math.round(amount * Number(taxes.sgstRate))
    : 0;

  const igst = !isIntraState
    ? Math.round(amount * Number(taxes.igstRate))
    : 0;

  return {
    amount,
    cgst,
    sgst,
    igst,
    total: Math.round(amount + cgst + sgst + igst),
  };
}