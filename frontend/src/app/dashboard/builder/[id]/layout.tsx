'use client'

import { use } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Loader2, CheckCircle, Circle } from 'lucide-react'
import { clsx } from 'clsx'
import { useBuilderCase } from '@/hooks/useBuilder'

const STEPS = [
  { key: 'edit',       label: 'Informações',  path: 'edit' },
  { key: 'stages',     label: 'Stages',       path: 'stages' },
  { key: 'characters', label: 'Personagens',  path: 'characters' },
  { key: 'evidence',   label: 'Evidências',   path: 'evidence' },
  { key: 'submit',     label: 'Submeter',     path: 'submit' },
]

export default function BuilderCaseLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { id: string }
}) {
  const { id } = params
  const pathname = usePathname()
  const { data: submission, isLoading } = useBuilderCase(id)

  const activeStep = STEPS.find((s) => pathname.endsWith(s.path))?.key ?? 'edit'
  const isEditable = !submission || ['draft', 'rejected'].includes(submission.status)

  return (
    <div className="flex min-h-screen">
      {/* Builder sidebar */}
      <aside className="w-56 border-r border-crime-border bg-crime-surface shrink-0 flex flex-col">
        <div className="p-4 border-b border-crime-border">
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-crime-text-faint mb-1">Case Builder</p>
          {isLoading
            ? <div className="h-4 bg-crime-muted/40 rounded animate-pulse" />
            : <p className="text-sm font-bold text-crime-text-primary truncate">{submission?.case?.title ?? 'Novo Caso'}</p>
          }
        </div>

        {/* Status pill */}
        {submission && (
          <div className="px-4 py-3 border-b border-crime-border">
            <span className={clsx('badge text-[10px]', {
              'bg-crime-muted text-crime-text-faint':     submission.status === 'draft',
              'bg-blue-950 text-blue-400':                submission.status === 'submitted',
              'bg-yellow-950 text-yellow-400':            submission.status === 'under_review',
              'bg-green-950 text-green-400':              submission.status === 'approved',
              'bg-red-950 text-red-400':                  submission.status === 'rejected',
              'bg-crime-red/15 text-crime-red':           submission.status === 'published',
            })}>
              {submission.status}
            </span>
          </div>
        )}

        {/* Steps */}
        <nav className="flex-1 p-3 space-y-0.5">
          {STEPS.map((step) => {
            const isActive = activeStep === step.key
            const disabled = !isEditable && step.key !== 'submit'

            return (
              <Link
                key={step.key}
                href={`/dashboard/builder/${id}/${step.path}`}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-md text-xs transition-all',
                  isActive
                    ? 'bg-crime-red/15 text-crime-red border border-crime-red/20'
                    : disabled
                      ? 'text-crime-text-faint opacity-50 pointer-events-none'
                      : 'text-crime-text-muted hover:text-crime-text-primary hover:bg-crime-muted/30'
                )}
              >
                {isActive
                  ? <Circle size={12} className="fill-crime-red text-crime-red" />
                  : <Circle size={12} />
                }
                {step.label}
              </Link>
            )
          })}
        </nav>

        {/* Back link */}
        <div className="p-3 border-t border-crime-border">
          <Link href="/dashboard/builder" className="text-xs text-crime-text-faint hover:text-crime-red transition-colors">
            ← Os Meus Casos
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={28} className="text-crime-red animate-spin" />
          </div>
        ) : children}
      </main>
    </div>
  )
}
