import { Request, Response } from 'express'
import { uploadFile, UploadFolder } from '../services/upload.service'
import { sendSuccess, sendError } from '../utils/response'
import { isCloudinaryConfigured } from '../config/cloudinary'

// Mapear contexto → folder Cloudinary
const FOLDER_MAP: Record<string, UploadFolder> = {
  cover:     'crime-game/covers',
  evidence:  'crime-game/evidence',
  avatar:    'crime-game/avatars',
  misc:      'crime-game/misc',
}

export const upload = async (req: Request, res: Response): Promise<void> => {
  if (!isCloudinaryConfigured()) {
    sendError(res, 'Upload não configurado. Define as variáveis CLOUDINARY_* no .env', 503)
    return
  }

  if (!req.file) {
    sendError(res, 'Nenhum ficheiro enviado', 400)
    return
  }

  const context = (req.query.context as string) ?? 'misc'
  const folder = FOLDER_MAP[context] ?? 'crime-game/misc'

  try {
    const result = await uploadFile(
      req.file.buffer,
      req.file.mimetype,
      folder,
      req.file.originalname
    )
    sendSuccess(res, { url: result.url, publicId: result.publicId, ...result }, 'Upload concluído')
  } catch (err: any) {
    if (err.message?.startsWith('UNSUPPORTED_TYPE')) {
      sendError(res, 'Tipo de ficheiro não suportado', 415)
    } else if (err.message?.startsWith('FILE_TOO_LARGE')) {
      const max = err.message.split(':')[1]
      sendError(res, `Ficheiro demasiado grande (máx. ${max})`, 413)
    } else if (err.message === 'CLOUDINARY_NOT_CONFIGURED') {
      sendError(res, 'Serviço de upload não configurado', 503)
    } else {
      throw err
    }
  }
}
