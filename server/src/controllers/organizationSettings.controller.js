import asyncHandler from 'express-async-handler';
import { z } from 'zod';
import Invoice from '../models/Invoice.js';
import Counter from '../models/Counter.js';
import OrganizationSettings from '../models/OrganizationSettings.js';
import { getOrganizationSettings } from '../services/organizationSettings.service.js';

const settingsSchema = z.object({
  organizationName: z.string().trim().min(2).max(120),
  homeState: z.string().trim().min(2).max(80),
  invoiceStartNumber: z.coerce.number().int().min(1).max(999999999),
  taxes: z.object({ cgstRate: z.coerce.number().min(0).max(1), sgstRate: z.coerce.number().min(0).max(1), igstRate: z.coerce.number().min(0).max(1) }),
  templates: z.object({ intraState: z.enum(['template1.xlsx', 'template2.xlsx']), interstate: z.enum(['template1.xlsx', 'template2.xlsx']) })
});

export const readOrganizationSettings = asyncHandler(async (_req, res) => res.json({ settings: await getOrganizationSettings() }));
export const updateOrganizationSettings = asyncHandler(async (req, res) => {
  const data = settingsSchema.parse(req.body);
  const current = await getOrganizationSettings();
  const hasInvoices = await Invoice.exists({});
  if (hasInvoices && data.invoiceStartNumber !== current.invoiceStartNumber) return res.status(422).json({ message: 'Invoice start number cannot be changed after the first invoice is created.' });
  const settings = await OrganizationSettings.findOneAndUpdate({ key: 'default' }, data, { new: true, runValidators: true });
  if (!hasInvoices) await Counter.deleteOne({ _id: 'invoiceNumber' });
  res.json({ settings });
});
