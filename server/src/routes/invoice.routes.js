import { Router } from 'express';
import {
  createInvoice,
  deleteInvoice,
  downloadInvoice,
  listInvoices,
} from '../controllers/invoice.controller.js';
import { allowRoles, requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', listInvoices);

router.post(
  '/',
  allowRoles('admin', 'operator'),
  createInvoice
);

router.get('/:id/download', downloadInvoice);

// Only administrators can permanently delete invoices.
router.delete('/:id', allowRoles('admin'), deleteInvoice);

export default router;