import asyncHandler from 'express-async-handler';
import path from 'node:path';
import fs from 'node:fs/promises';
import { z } from 'zod';
import Company from '../models/Company.js';
import Invoice from '../models/Invoice.js';
import Counter from '../models/Counter.js';
import { calculateInvoice } from '../utils/invoiceCalculations.js';
import { createInvoiceWorkbook } from '../services/invoiceWorkbook.service.js';
import { getOrganizationSettings } from '../services/organizationSettings.service.js';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid selection.');
const inputSchema = z.object({ companyId: objectId, branchId: objectId, contractId: objectId, candidateName: z.string().trim().min(1).max(120), employeeCode: z.string().trim().min(1).max(50), role: z.string().trim().min(1).max(120), city: z.string().trim().min(1).max(80), ctc: z.coerce.number().int().positive(), dateOfJoining: z.string().trim().min(1).max(30) });

export const createInvoice = asyncHandler(async (req, res) => {
  const payload = inputSchema.parse(req.body);
  const company = await Company.findOne({ _id: payload.companyId, isActive: true });
  if (!company) return res.status(422).json({ message: 'Select an active company.' });
  const branch = company.branches.id(payload.branchId);
  const contract = company.contracts.id(payload.contractId);
  if (!branch || !contract || !contract.isActive) return res.status(422).json({ message: 'The selected GST branch or contract is no longer available.' });
  const settings = await getOrganizationSettings();
  const isIntraState = branch.state.trim().toLowerCase() === settings.homeState.trim().toLowerCase();
  const rate = contract.value;
  const calculation = { ...calculateInvoice(rate, payload.ctc, isIntraState, settings.taxes), rate };
  await Counter.updateOne({ _id: 'invoiceNumber' }, { $setOnInsert: { value: settings.invoiceStartNumber - 1 } }, { upsert: true });
  const counter = await Counter.findByIdAndUpdate('invoiceNumber', { $inc: { value: 1 } }, { new: true });
  const invoiceNumber = counter.value;
  const generatedFile = await createInvoiceWorkbook({ invoiceNumber, company, branch, contract, payload, calculation, settings, isIntraState });
  const invoice = await Invoice.create({ invoiceNumber, candidateName: payload.candidateName, employeeCode: payload.employeeCode, role: payload.role, city: payload.city, state: branch.state, grade: contract.grade, ctc: payload.ctc, dateOfJoining: payload.dateOfJoining, company: { id: company._id, code: company.code, legalName: company.legalName, branch: branch.toObject(), contract: contract.toObject() }, organization: { name: settings.organizationName, homeState: settings.homeState, taxes: settings.taxes.toObject ? settings.taxes.toObject() : settings.taxes, template: isIntraState ? settings.templates.intraState : settings.templates.interstate }, amount: calculation.amount, rate, cgst: calculation.cgst, sgst: calculation.sgst, igst: calculation.igst, total: calculation.total, generatedFile, createdBy: req.user._id });
  res.status(201).json({ invoice, downloadUrl: `/api/invoices/${invoice._id}/download` });
});

export const listInvoices = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 30, 100);
  const invoices = await Invoice.find().sort({ invoiceNumber: -1 }).limit(limit).populate('createdBy', 'name email').lean();
  res.json({ invoices });
});

export const downloadInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id).lean();
  if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
  const filePath = path.resolve(process.cwd(), 'generated', invoice.generatedFile);
  try { await fs.access(filePath); } catch { return res.status(404).json({ message: 'Generated workbook no longer exists' }); }
  res.download(filePath, invoice.generatedFile);
});
