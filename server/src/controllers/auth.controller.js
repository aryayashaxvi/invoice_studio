import asyncHandler from 'express-async-handler';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import User from '../models/User.js';
import { hashPassword, verifyPassword } from '../utils/passwords.js';

const loginSchema = z.object({ email: z.string().email().max(160), password: z.string().min(8).max(128) });
const userSchema = z.object({ name: z.string().trim().min(2).max(100), email: z.string().email().max(160), password: z.string().min(8).max(128), role: z.enum(['admin', 'operator']) });
const publicUser = (user) => ({ id: user._id, name: user.name, email: user.email, role: user.role, isActive: user.isActive, createdAt: user.createdAt });
const issueToken = (user) => jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '8h' });

export const login = asyncHandler(async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!user || !user.isActive || !(await verifyPassword(password, user.passwordHash))) return res.status(401).json({ message: 'Invalid email or password.' });
  res.json({ token: issueToken(user), user: publicUser(user) });
});
export const me = asyncHandler(async (req, res) => res.json({ user: publicUser(req.user) }));
export const listUsers = asyncHandler(async (_req, res) => res.json({ users: (await User.find().sort({ createdAt: -1 }).lean()).map(publicUser) }));
export const createUser = asyncHandler(async (req, res) => {
  const data = userSchema.parse(req.body);
  const passwordHash = await hashPassword(data.password);
  const user = await User.create({ ...data, email: data.email.toLowerCase(), passwordHash });
  res.status(201).json({ user: publicUser(user) });
});
export const updateUserStatus = asyncHandler(async (req, res) => {
  const { isActive } = z.object({ isActive: z.boolean() }).parse(req.body);
  if (req.params.id === req.user._id.toString() && !isActive) return res.status(422).json({ message: 'You cannot deactivate your own account.' });
  const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true });
  if (!user) return res.status(404).json({ message: 'User not found.' });
  res.json({ user: publicUser(user) });
});
