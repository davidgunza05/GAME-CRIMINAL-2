import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import { handleUpload } from '../middleware/upload.middleware'
import { upload } from '../controllers/upload.controller'

const router = Router()

// POST /api/upload?context=cover|evidence|avatar|misc
router.post('/', authenticate, handleUpload, upload)

export default router
