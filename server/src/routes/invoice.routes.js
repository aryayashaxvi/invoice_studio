import { Router } from 'express';
import { createInvoice, downloadInvoice, listInvoices } from '../controllers/invoice.controller.js';
import { allowRoles, requireAuth } from '../middleware/auth.js';
const router = Router();
router.use(requireAuth);
router.get('/', listInvoices);
router.post('/', allowRoles('admin', 'operator'), createInvoice);
router.get('/:id/download', downloadInvoice);
export default router;
