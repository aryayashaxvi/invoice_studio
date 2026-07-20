import ExcelJS from 'exceljs';
import path from 'node:path';
import fs from 'node:fs/promises';
import { invoiceAmountWords } from '../utils/numberToWords.js';

const assetPath = (...parts) => path.resolve(process.cwd(), 'assets', ...parts);
const today = () => new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date()).replaceAll('/', '-');
const makeBold = (cell) => { cell.font = { ...cell.font, bold: true }; };
const setSize = (cell, size) => { cell.font = { ...cell.font, size }; };

export async function createInvoiceWorkbook({ invoiceNumber, company, branch, contract, payload, calculation, settings, isIntraState }) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(assetPath('templates', isIntraState ? settings.templates.intraState : settings.templates.interstate));
  const sheet = workbook.worksheets[0];
  sheet.getCell('A9').value = `4      Invoice  No.           ${isIntraState ? '  ' : ''}:      ${invoiceNumber}`;
  sheet.getCell('A10').value = `5.     Date of Invoice       :     ${today()}`;
  sheet.getCell('B7').value = `              :      ${settings.organizationName}`;
  sheet.getCell('B13').value = `   ${company.legalName}`;
  makeBold(sheet.getCell('B13'));
  sheet.getCell('A14').value = company.invoiceSettings?.addressDisplayMode === 'stateOnly' ? `Address         :      ${branch.state}` : `Address         :      ${branch.addressLine1}, ${branch.addressLine2}, ${branch.city}, ${branch.billingState}, pin: ${branch.pin}`;
  sheet.getCell('A15').value = `State Code   :       ${branch.stateCode}`;
  sheet.getCell('A16').value = `GSTIN              :        ${branch.gstNo}`;
  makeBold(sheet.getCell('A16'));
  sheet.getCell('A20').value = `Charges Towards placement of ${payload.candidateName} as`;
  sheet.getCell('A21').value = `${payload.role} at ${payload.city}(${branch.state})`;
  sheet.getCell('A22').value = `DOJ: ${payload.dateOfJoining}, EMP Code- ${payload.employeeCode}`;
  sheet.getCell('A23').value = `Grade-${contract.grade}, Package ${payload.ctc}/-`;
  sheet.getCell('D21').value = `${payload.ctc}/-`;
  setSize(sheet.getCell('D21'), 11);
  if (calculation.rate > 1) { sheet.getCell('E21').value = 'Fix'; sheet.getCell('E22').value = 'Rate'; setSize(sheet.getCell('E21'), 11); setSize(sheet.getCell('E22'), 11); }
  else { sheet.getCell('E21').value = `${calculation.rate * 100}%`; setSize(sheet.getCell('E21'), 11); }
  sheet.getCell('F21').value = `${calculation.amount}/-`;
  setSize(sheet.getCell('F21'), 11);
  sheet.getCell('G21').value = calculation.amount;
  sheet.getCell('G24').value = calculation.amount;
  if (isIntraState) {
    sheet.getCell('A25').value = `ADD CGST @ ${settings.taxes.cgstRate * 100}%`;
    sheet.getCell('A26').value = `ADD SGST @ ${settings.taxes.sgstRate * 100}%`;
    sheet.getCell('G25').value = { formula: `G24*${settings.taxes.cgstRate}`, result: calculation.cgst };
    sheet.getCell('G26').value = { formula: `G24*${settings.taxes.sgstRate}`, result: calculation.sgst };
    sheet.getCell('G27').value = { formula: 'SUM(G24:G26)', result: calculation.amount + calculation.cgst + calculation.sgst };
    sheet.getCell('G28').value = { formula: 'ROUND(G27, 0)', result: calculation.total };
    sheet.getCell('A30').value = `${invoiceAmountWords(calculation.total)} ${settings.organizationName.toUpperCase()}`;
    makeBold(sheet.getCell('A30'));
  } else {
    sheet.getCell('A25').value = `ADD IGST @ ${settings.taxes.igstRate * 100}%`;
    sheet.getCell('G25').value = { formula: `G24*${settings.taxes.igstRate}`, result: calculation.igst };
    sheet.getCell('G26').value = { formula: 'SUM(G24:G25)', result: calculation.amount + calculation.igst };
    sheet.getCell('G27').value = { formula: 'ROUND(G26, 0)', result: calculation.total };
    sheet.getCell('A29').value = `${invoiceAmountWords(calculation.total)} ${settings.organizationName.toUpperCase()}`;
    makeBold(sheet.getCell('A29'));
  }
  const outputDir = path.resolve(process.cwd(), 'generated');
  await fs.mkdir(outputDir, { recursive: true });
  const outputName = `invoice ${invoiceNumber}.xlsx`;
  await workbook.xlsx.writeFile(path.join(outputDir, outputName));
  return outputName;
}
