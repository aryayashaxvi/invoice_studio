import 'dotenv/config';
import { connectDatabase } from '../config/db.js';
import User from '../models/User.js';
import { hashPassword } from '../utils/passwords.js';
const [name, email, password] = process.argv.slice(2);
if (!name || !email || !password) { console.error('Usage: npm run create-admin -- "Admin Name" admin@company.com SecurePassword'); process.exit(1); }
try { await connectDatabase(); const passwordHash = await hashPassword(password); await User.findOneAndUpdate({ email: email.toLowerCase() }, { name, email: email.toLowerCase(), passwordHash, role: 'admin', isActive: true }, { upsert: true, new: true }); console.log(`Admin account is ready: ${email}`); process.exit(0); } catch (error) { console.error(error); process.exit(1); }
