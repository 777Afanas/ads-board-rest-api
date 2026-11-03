import { Router } from 'express';
import * as announcementsController from '../controllers/announcements.controller';
import { validateBody, validateParams, validateQuery } from '../middleware/validate';
import {
  createAnnouncementSchema,
  updateAnnouncementSchema,
  idParamSchema,
  queryAnnouncementSchema,
} from '../validators/announcements.validator';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.get('/', validateQuery(queryAnnouncementSchema), announcementsController.getAll);
router.get('/:id', validateParams(idParamSchema), announcementsController.getById);

router.post('/', authenticate, validateBody(createAnnouncementSchema), announcementsController.create);
router.patch(
  '/:id',
  authenticate,
  validateParams(idParamSchema),
  validateBody(updateAnnouncementSchema),
  announcementsController.update
);
router.delete('/:id', authenticate, validateParams(idParamSchema), announcementsController.remove);

export default router;