import { Router } from 'express';
import {
  createState,
  deactivateState,
  listStates,
  updateState,
} from '../controllers/state.controller.js';
import { allowRoles, requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', listStates);

router.post('/', allowRoles('admin'), createState);
router.put('/:id', allowRoles('admin'), updateState);
router.delete('/:id', allowRoles('admin'), deactivateState);

export default router;