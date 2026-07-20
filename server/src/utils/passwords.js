import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
const scrypt = promisify(scryptCallback);
export async function hashPassword(password) { const salt = randomBytes(16).toString('hex'); const hash = await scrypt(password, salt, 64); return `${salt}:${Buffer.from(hash).toString('hex')}`; }
export async function verifyPassword(password, stored) { const [salt, savedHash] = stored.split(':'); if (!salt || !savedHash) return false; const hash = Buffer.from(await scrypt(password, salt, 64)); const saved = Buffer.from(savedHash, 'hex'); return hash.length === saved.length && timingSafeEqual(hash, saved); }
