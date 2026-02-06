import express from 'express';
import { upload } from '../config/multer.js';
import { uploadImage } from '../controllers/upload.controller.js';

const router = express.Router();

// Single file: POST /api/upload
router.post('/', upload.single('image'), uploadImage);

// Multiple files: POST /api/upload/multiple
router.post('/multiple', upload.array('images', 5), uploadImage);

export default router;
