export function invoiceAmountWords(num) {
  if (num === 0) return 'Please Transfer Rs zero only in A/C of M/S';
  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const words = (n) => n < 10 ? units[n] : n < 20 ? teens[n - 10] : n < 100 ? `${tens[Math.floor(n / 10)]}${n % 10 ? ` ${units[n % 10]}` : ''}` : `${units[Math.floor(n / 100)]} Hundred${n % 100 ? ` ${words(n % 100)}` : ''}`;
  const crore = Math.floor(num / 10000000), lakh = Math.floor((num % 10000000) / 100000), thousand = Math.floor((num % 100000) / 1000), remainder = num % 1000;
  return `Please Transfer Rs ${crore ? `${words(crore)} Crore ` : ''}${lakh ? `${words(lakh)} Lakh ` : ''}${thousand ? `${words(thousand)} Thousand ` : ''}${remainder ? words(remainder) : ''} only in A/C of M/S`;
}
