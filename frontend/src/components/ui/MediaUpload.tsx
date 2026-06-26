'use client'

import { useRef, useState, useCallback } from 'react'
import { Upload, X, Loader2, Image, FileText, Music, Video, CheckCircle, AlertCircle } from 'lucide-react'
import { clsx } from 'clsx'
import api from '@/lib/api'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type UploadContext = 'cover' | 'evidence' | 'avatar' | 'misc'
export type AcceptType = 'image' | 'video' | 'audio' | 'document' | 'any'

interface Props {
  value?: string                    // URL actual (pré-visualização)
  onChange: (url: string) => void   // callback com URL final após upload
  context?: UploadContext
  accept?: AcceptType
  label?: string
  hint?: string
  disabled?: boolean
  className?: string
  previewType?: 'image' | 'none'   // como mostrar o preview
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ACCEPT_MAP: Record<AcceptType, string> = {
  image:    'image/jpeg,image/png,image/webp,image/gif',
  video:    'video/mp4,video/webm,video/quicktime',
  audio:    'audio/mpeg,audio/wav,audio/ogg,audio/webm',
  document: 'application/pdf,text/plain',
  any:      'image/*,video/*,audio/*,application/pdf,text/plain',
}

const FILE_ICON: Record<string, React.ElementType> = {
  image: Image, video: Video, audio: Music, document: FileText,
}

const getFileCategory = (mime: string): string => {
  if (mime.startsWith('image/'))       return 'image'
  if (mime.startsWith('video/'))       return 'video'
  if (mime.startsWith('audio/'))       return 'audio'
  return 'document'
}

const formatBytes = (b: number) => {
  if (b < 1024)       return `${b} B`
  if (b < 1048576)    return `${(b / 1024).toFixed(1)} KB`
  return `${(b / 1048576).toFixed(1)} MB`
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function MediaUpload({
  value,
  onChange,
  context = 'misc',
  accept = 'any',
  label,
  hint,
  disabled = false,
  className,
  previewType = 'image',
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number; category: string } | null>(null)

  const doUpload = useCallback(async (file: File) => {
    setError(null)
    setUploading(true)
    setProgress(0)
    setFileInfo({ name: file.name, size: file.size, category: getFileCategory(file.type) })

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await api.post(`/upload?context=${context}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (e.total) setProgress(Math.round((e.loaded / e.total) * 100))
        },
      })
      onChange(res.data.data.url)
      setProgress(100)
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Erro ao fazer upload. Tenta novamente.'
      setError(msg)
      setFileInfo(null)
    } finally {
      setUploading(false)
    }
  }, [context, onChange])

  const handleFiles = (files: FileList | null) => {
    if (!files?.length || disabled) return
    doUpload(files[0])
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
    setFileInfo(null)
    setError(null)
    setProgress(0)
    if (inputRef.current) inputRef.current.value = ''
  }

  const isImage = value && previewType === 'image' &&
    (value.match(/\.(jpg|jpeg|png|webp|gif)(\?|$)/i) || value.includes('cloudinary'))

  const CategoryIcon = fileInfo ? (FILE_ICON[fileInfo.category] ?? FileText) : Upload

  return (
    <div className={clsx('space-y-2', className)}>
      {label && (
        <label className="label">{label}</label>
      )}

      {/* Zona de drop / clique */}
      <div
        onClick={() => !disabled && !uploading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); !disabled && setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={clsx(
          'relative rounded-lg border-2 border-dashed transition-all cursor-pointer overflow-hidden',
          dragging && 'border-crime-red bg-crime-red/5 scale-[1.01]',
          !dragging && !value && 'border-crime-border hover:border-crime-text-faint',
          !dragging && value && 'border-crime-border/50',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
      >
        {/* Preview de imagem */}
        {isImage && !uploading && (
          <div className="relative">
            <img
              src={value}
              alt="Preview"
              className="w-full max-h-48 object-cover"
            />
            <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
              <p className="text-white text-xs font-medium bg-black/50 px-3 py-1.5 rounded">
                Clica para substituir
              </p>
            </div>
            {!disabled && (
              <button
                onClick={clear}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 hover:bg-red-900 flex items-center justify-center transition-colors"
              >
                <X size={14} className="text-white" />
              </button>
            )}
          </div>
        )}

        {/* Conteúdo principal (sem preview de imagem) */}
        {(!isImage || uploading) && (
          <div className="flex flex-col items-center justify-center gap-3 py-8 px-4">
            {uploading ? (
              <>
                <Loader2 size={28} className="text-crime-red animate-spin" />
                <div className="w-full max-w-[200px]">
                  <div className="h-1.5 bg-crime-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-crime-red transition-all duration-300 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-crime-text-faint text-center mt-1.5">{progress}%</p>
                </div>
                {fileInfo && (
                  <p className="text-xs text-crime-text-faint text-center">
                    {fileInfo.name} · {formatBytes(fileInfo.size)}
                  </p>
                )}
              </>
            ) : value && !isImage ? (
              /* Ficheiro não-imagem já carregado */
              <>
                <div className="w-10 h-10 rounded-full bg-green-950 border border-green-800 flex items-center justify-center">
                  <CheckCircle size={20} className="text-green-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm text-crime-text-primary font-medium">Ficheiro carregado</p>
                  {fileInfo && (
                    <p className="text-xs text-crime-text-faint mt-0.5">
                      {fileInfo.name} · {formatBytes(fileInfo.size)}
                    </p>
                  )}
                  <a
                    href={value}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs text-crime-red hover:underline mt-1 inline-block"
                  >
                    Ver ficheiro →
                  </a>
                </div>
                {!disabled && (
                  <button onClick={clear} className="text-xs text-crime-text-faint hover:text-red-400 flex items-center gap-1">
                    <X size={11} /> Remover
                  </button>
                )}
              </>
            ) : (
              /* Estado vazio */
              <>
                <div className="w-12 h-12 rounded-full bg-crime-muted flex items-center justify-center">
                  <CategoryIcon size={22} className="text-crime-text-faint" />
                </div>
                <div className="text-center">
                  <p className="text-sm text-crime-text-primary">
                    <span className="text-crime-red">Clica para escolher</span> ou arrasta aqui
                  </p>
                  {hint && <p className="text-xs text-crime-text-faint mt-1">{hint}</p>}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Erro */}
      {error && (
        <div className="flex items-center gap-2 text-xs text-red-400 bg-red-950/40 border border-red-900/50 rounded px-3 py-2">
          <AlertCircle size={12} className="shrink-0" />
          {error}
        </div>
      )}

      {/* Input hidden */}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_MAP[accept]}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
        disabled={disabled || uploading}
      />
    </div>
  )
}
