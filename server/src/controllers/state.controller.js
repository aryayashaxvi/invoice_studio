import asyncHandler from 'express-async-handler';
import { z } from 'zod';
import State from '../models/State.js';

const stateSchema = z.object({
  name: z.string().trim().min(2).max(80),
});

export const listStates = asyncHandler(async (req, res) => {
  const query = req.query.includeInactive === 'true' ? {} : { isActive: true };

  const states = await State.find(query).sort({ name: 1 }).lean();
  res.json({ states });
});

export const createState = asyncHandler(async (req, res) => {
  const { name } = stateSchema.parse(req.body);

  const state = await State.create({ name });
  res.status(201).json({ state });
});

export const updateState = asyncHandler(async (req, res) => {
  const { name } = stateSchema.parse(req.body);

  const state = await State.findByIdAndUpdate(
    req.params.id,
    { name },
    { new: true, runValidators: true }
  );

  if (!state) {
    return res.status(404).json({ message: 'State not found.' });
  }

  res.json({ state });
});

export const deactivateState = asyncHandler(async (req, res) => {
  const state = await State.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );

  if (!state) {
    return res.status(404).json({ message: 'State not found.' });
  }

  res.json({ state });
});