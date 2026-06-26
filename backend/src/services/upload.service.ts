import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary'
import { Readable } from 'stream'

// Tipos de upload aceites por contexto
export type UploadFolder =
  | 'crime-game/covers'       // capas de casos
  | 'crime-game/evidence'     // ficheiros de evidência
  | 'crime-game/avatars'      // avatares de utilizador e personagem
  | 'crime-game/misc'         // outros

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_VIDEO_TYPES  = ['video/mp4', 'video/webm', 'video/quicktime']
const ALLOWED_AUDIO_TYPES  = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm']
const ALLOWED_DOC_TYPES    = ['application/pdf', 'text/plain']

const MAX_SIZES: Record<string, number> = {
  image: 10 * 1024 * 1024,  // 10 MB
  video: 100 * 1024 * 1024, // 100 MB
  audio: 50 * 1024 * 1024,  // 50 MB
  doc:   20 * 1024 * 1024,  // 20 MB
}

export interface UploadResult {
  url: string
  publicId: string
  resourceType: string
  format: string
  width?: number
  height?: number
  duration?: number
  bytes: number
}

// Determinar tipo de recurso Cloudinary e validar
const classify = (mimeType: string): { resourceType: 'image' | 'video' | 'raw'; category: string } => {
  if (ALLOWED_IMAGE_TYPES.includes(mimeType)) return { resourceType: 'image', category: 'image' }
  if (ALLOWED_VIDEO_TYPES.includes(mimeType))  return { resourceType: 'video', category: 'video' }
  if (ALLOWED_AUDIO_TYPES.includes(mimeType))  return { resourceType: 'video', category: 'audio' } // Cloudinary usa 'video' para áudio
  if (ALLOWED_DOC_TYPES.includes(mimeType))    return { resourceType: 'raw',   category: 'doc' }
  throw new Error(`UNSUPPORTED_TYPE:${mimeType}`)
}

export const uploadFile = async (
  buffer: Buffer,
  mimeType: string,
  folder: UploadFolder,
  filename?: string
): Promise<UploadResult> => {
  if (!isCloudinaryConfigured()) throw new Error('CLOUDINARY_NOT_CONFIGURED')

  const { resourceType, category } = classify(mimeType)
  const maxSize = MAX_SIZES[category]

  if (buffer.length > maxSize) {
    throw new Error(`FILE_TOO_LARGE:${Math.round(maxSize / 1024 / 1024)}MB`)
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        public_id: filename ? `${Date.now()}-${filename.replace(/\.[^.]+$/, '')}` : undefined,
        transformation: resourceType === 'image'
          ? [{ quality: 'auto', fetch_format: 'auto' }]
          : undefined,
      },
      (error, result) => {
        if (error || !result) { reject(error ?? new Error('UPLOAD_FAILED')); return }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          resourceType: result.resource_type,
          format: result.format,
          width: result.width,
          height: result.height,
          duration: (result as any).duration,
          bytes: result.bytes,
        })
      }
    )
    Readable.from(buffer).pipe(uploadStream)
  })
}

export const deleteFile = async (publicId: string, resourceType = 'image') => {
  if (!isCloudinaryConfigured()) return
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType as any })
}
