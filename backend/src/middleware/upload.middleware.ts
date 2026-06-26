import multer from 'multer'
import { Request, Response, NextFunction } from 'express'

// Guardar em memória — passa buffer directo ao Cloudinary
const storage = multer.memoryStorage()

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = [
    'image/jpeg','image/jpg','image/png','image/webp','image/gif',
    'video/mp4','video/webm','video/quicktime',
    'audio/mpeg','audio/mp3','audio/wav','audio/ogg','audio/webm',
    'application/pdf','text/plain',
  ]
  if (allowed.includes(file.mimetype)) cb(null, true)
  else cb(new Error(`UNSUPPORTED_TYPE:${file.mimetype}`))
}

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB máximo (o service valida por tipo)
}).single('file')

// Wrapper que converte erro do multer em resposta clara
export const handleUpload = (req: Request, res: Response, next: NextFunction) => {
  uploadMiddleware(req, res, (err) => {
    if (!err) return next()
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(413).json({ success: false, message: 'Ficheiro demasiado grande (máx. 100 MB)' })
      } else {
        res.status(400).json({ success: false, message: err.message })
      }
    } else {
      const msg = err?.message?.startsWith('UNSUPPORTED_TYPE')
        ? 'Tipo de ficheiro não suportado'
        : err?.message ?? 'Erro no upload'
      res.status(400).json({ success: false, message: msg })
    }
  })
}
