import asyncHandler from 'express-async-handler';
import { z } from 'zod';
import Company from '../models/Company.js';

const branchSchema = z.object({ _id: z.string().optional(), state: z.string().trim().min(2).max(80), stateCode: z.string().trim().min(1).max(10), gstNo: z.string().trim().min(5).max(30), addressLine1: z.string().trim().max(180).default(''), addressLine2: z.string().trim().max(180).default(''), city: z.string().trim().max(80).default(''), billingState: z.string().trim().max(80).default(''), pin: z.string().trim().max(20).default('') });
const contractSchema = z.object({ _id: z.string().optional(), grade: z.string().trim().min(1).max(40), pricingType: z.enum(['fixed', 'percentage']), value: z.coerce.number().positive(), isActive: z.boolean().default(true) });
const companySchema = z.object({ code: z.string().trim().min(2).max(30).regex(/^[A-Za-z0-9_-]+$/, 'Use letters, numbers, hyphens, or underscores only.'), legalName: z.string().trim().min(2).max(160), isActive: z.boolean().default(true), invoiceSettings: z.object({ addressDisplayMode: z.enum(['full', 'stateOnly']).default('full'), employeeCodePrefix: z.string().trim().max(30).default('') }).default({}), branches: z.array(branchSchema).default([]), contracts: z.array(contractSchema).default([]) }).superRefine((data, ctx) => {
  const duplicateState = data.branches.map((item) => item.state.toLowerCase()).find((state, index, all) => all.indexOf(state) !== index);
  const duplicateGrade = data.contracts.map((item) => item.grade.toLowerCase()).find((grade, index, all) => all.indexOf(grade) !== index);
  if (duplicateState) ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Duplicate branch state: ${duplicateState}` });
  if (duplicateGrade) ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Duplicate contract grade: ${duplicateGrade}` });
});

const serialize = (company) => ({ ...company, id: company._id });
export const listCompanies = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'admin' && req.query.includeInactive === 'true' ? {} : { isActive: true };
  const companies = await Company.find(filter).sort({ legalName: 1 }).lean();
  res.json({ companies: companies.map(serialize) });
});
export const getCompany = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.params.id).lean();
  if (!company || (!company.isActive && req.user.role !== 'admin')) return res.status(404).json({ message: 'Company not found.' });
  res.json({ company: serialize(company) });
});
export const createCompany = asyncHandler(async (req, res) => {
  const data = companySchema.parse(req.body); data.code = data.code.toUpperCase();
  const company = await Company.create(data); res.status(201).json({ company: serialize(company.toObject()) });
});
export const updateCompany = asyncHandler(async (req, res) => {
  const data = companySchema.parse(req.body); data.code = data.code.toUpperCase();
  const company = await Company.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
  if (!company) return res.status(404).json({ message: 'Company not found.' });
  res.json({ company: serialize(company.toObject()) });
});
export const deactivateCompany = asyncHandler(async (req, res) => {
  const company = await Company.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!company) return res.status(404).json({ message: 'Company not found.' });
  res.json({ company: serialize(company.toObject()), message: 'Company deactivated. Existing invoices remain available.' });
});
