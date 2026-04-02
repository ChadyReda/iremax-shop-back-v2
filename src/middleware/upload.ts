import multer from 'multer'
import path from 'path'
import { Request } from 'express'
import { AppError } from '../utils/AppError'

const ALLOWED_MIME = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]

// Use memory storage instead of disk
const storage = multer.memoryStorage()

function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void {
  if (ALLOWED_MIME.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new AppError('Only JPEG, PNG and WebP images are allowed', 400))
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
})