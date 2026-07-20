import asyncHandler from 'express-async-handler';
import { z } from 'zod';
import Invoice from '../models/Invoice.js';
import Counter from '../models/Counter.js';
import OrganizationSettings from '../models/OrganizationSettings.js';
import State from '../models/State.js';
import { getOrganizationSettings } from '../services/organizationSettings.service.js';

const settingsSchema = z.object({
  homeState: z.string().trim().min(2).max(80),

  invoiceStartNumber: z.coerce.number().int().min(1).max(999999999),

  taxes: z.object({
    cgstRate: z.coerce.number().min(0).max(1),
    sgstRate: z.coerce.number().min(0).max(1),
    igstRate: z.coerce.number().min(0).max(1),
  }),

  templates: z.object({
    intraState: z.enum(['template1.xlsx', 'template2.xlsx']),
    interstate: z.enum(['template1.xlsx', 'template2.xlsx']),
  }),

  issuer: z.object({
    legalName: z.string().trim().min(2).max(150),
    gstNumber: z.string().trim().min(5).max(30),
    registeredAddress: z.string().trim().min(5).max(500),

    bankAccountNumber: z.string().trim().min(3).max(80),
    bankAccountType: z.string().trim().min(2).max(80),
    bankNameAndAddress: z.string().trim().min(2).max(300),
    ifscCode: z.string().trim().min(5).max(20),
    panNumber: z.string().trim().min(5).max(20),

    signatoryCompanyName: z.string().trim().min(2).max(150),
  }),
});

export const readOrganizationSettings = asyncHandler(async (_req, res) => {
  const settings = await getOrganizationSettings();
  res.json({ settings });
});

export const updateOrganizationSettings = asyncHandler(async (req, res) => {
  const data = settingsSchema.parse(req.body);

  const stateExists = await State.exists({
    name: data.homeState,
    isActive: true,
  });

  if (!stateExists) {
    return res.status(422).json({
      message: 'Select an active home state from the state directory.',
    });
  }

  const current = await getOrganizationSettings();
  const hasInvoices = await Invoice.exists({});

  if (
    hasInvoices &&
    data.invoiceStartNumber !== current.invoiceStartNumber
  ) {
    return res.status(422).json({
      message:
        'Invoice start number cannot be changed after the first invoice is created.',
    });
  }

  const settings = await OrganizationSettings.findOneAndUpdate(
    { key: 'default' },
    data,
    { new: true, runValidators: true }
  );

  if (!hasInvoices) {
    await Counter.deleteOne({ _id: 'invoiceNumber' });
  }

  res.json({ settings });
});