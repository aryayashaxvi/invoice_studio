import { Router } from 'express';
import { readOrganizationSettings, updateOrganizationSettings } from '../controllers/organizationSettings.controller.js';
import { allowRoles, requireAuth } from '../middleware/auth.js';
const router = Router();
router.use(requireAuth, allowRoles('admin'));
router.get('/', readOrganizationSettings);
router.put('/', updateOrganizationSettings);
export default router;
