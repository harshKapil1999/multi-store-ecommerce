import { Router } from 'express';
import * as uploadController from '../controllers/upload.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes protected (authenticated users)
router.use(authenticate);

// Public upload endpoints
router.post('/presigned-url', uploadController.getPresignedUrl);
router.post('/confirm', uploadController.confirmUpload);
router.delete('/:key', uploadController.deleteMedia);

export default router;
