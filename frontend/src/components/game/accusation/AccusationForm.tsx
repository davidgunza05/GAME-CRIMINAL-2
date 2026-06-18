'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AlertTriangle, CheckCircle, XCircle, Scale, Loader2 } from 'lucide-react'
import { clsx } from 'clsx'
import { Character, EvidenceUnlock } from '@/types/game'

const schema = z.object({
  suspectId:     z.string().uuid('Seleciona um suspeito'),
  motive:        z.string().min(10, 'Mínimo 10 caracteres').max(1000),
  method:        z.string().min(5, 'Mínimo 5 caracteres').max(500),
  evidenceCited: z.array(z.string()).min(1, 'Cita pelo menos uma evidência'),
})
type FormData = z.infer<typeof schema>

interface AccusationFormProps {
  characters: Character[]
  evidence: EvidenceUnlock[]
  onSubmit: (data: FormData) => Promise<{ result: string; feedbackText: string }>
  attemptNumber: number
}

export default function AccusationForm({ characters, evidence, onSubmit, attemptNumber }: AccusationFormProps) {
  const [lastResult, setLastResult] = useState<{ result: string; feedbackText: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { evidenceCited: [] },
  })

  const selectedSuspect = watch('suspectId')
  const selectedEvidence = watch('evidenceCited') ?? []

  const toggleEvidence = (id: string) => {
    setValue(
      'evidenceCited',
      selectedEvidence.includes(id)
        ? selectedEvidence.filter((e) => e !== id)
        : [...selectedEvidence, id],
      { shouldValidate: true }
    )
  }

  const handleFormSubmit = async (data: FormData) => {
    setSubmitting(true)
    try {
      const result = await onSubmit(data)
      setLastResult(result)
    } finally {
      setSubmitting(false)
    }
  }

  const suspect = characters.find((c) => c.id === selectedSuspect)

  return (
    <div className="af-root">
      {/* Header */}
      <div className="af-header">
        <div className="af-header-icon">
          <Scale size={22} color="#C0392B" />
        </div>
        <div>
          <p className="af-eyebrow">Momento da Verdade</p>
          <h1 className="af-title">Fazer Acusação</h1>
          <p className="af-sub">
            Tentativa {attemptNumber}. Analisa bem as evidências antes de acusar.
          </p>
        </div>
      </div>

      {/* Previous result */}
      <AnimatePresence>
        {lastResult && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={clsx('af-result', lastResult.result === 'correct' ? 'af-result-correct' : 'af-result-wrong')}
          >
            {lastResult.result === 'correct'
              ? <CheckCircle size={16} />
              : <XCircle size={16} />
            }
            <div>
              <p className="af-result-title">
                {lastResult.result === 'correct' ? '🎉 Correto! Resolveste o caso!' : '❌ Acusação incorreta'}
              </p>
              <p className="af-result-text">{lastResult.feedbackText}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="af-form">
        {/* Suspect grid */}
        <div className="af-section">
          <p className="af-section-label">Quem é o culpado?</p>
          <div className="af-suspects">
            {characters.map((char) => {
              const isSelected = selectedSuspect === char.id
              return (
                <motion.label
                  key={char.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={clsx('af-suspect', isSelected && 'af-suspect-selected')}
                >
                  <input type="radio" value={char.id} {...register('suspectId')} className="sr-only" />
                  <div className="af-suspect-avatar">
                    {char.avatarUrl
                      ? <img src={char.avatarUrl} alt={char.name} />
                      : <span>{char.name[0]}</span>
                    }
                    {isSelected && (
                      <motion.div
                        className="af-suspect-check"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                      >
                        <CheckCircle size={12} color="#fff" />
                      </motion.div>
                    )}
                  </div>
                  <p className="af-suspect-name">{char.name}</p>
                  <p className="af-suspect-desc">{char.description}</p>
                </motion.label>
              )
            })}
          </div>
          {errors.suspectId && (
            <p className="af-error"><AlertTriangle size={11} /> {errors.suspectId.message}</p>
          )}
        </div>

        {/* Selected suspect backstory */}
        <AnimatePresence>
          {suspect && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="af-suspect-detail"
            >
              <p className="af-section-label">Perfil do Suspeito</p>
              <p className="af-suspect-detail-text">{suspect.backstory}</p>
              <div className="af-suspect-detail-row">
                <div>
                  <span className="af-detail-micro">Álibi</span>
                  <p className="af-detail-val">{suspect.alibi}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Motive */}
        <div className="af-section">
          <label className="af-section-label">Motivo</label>
          <textarea
            className={clsx('af-textarea', errors.motive && 'af-field-error')}
            rows={3}
            placeholder="Qual foi o motivo do crime? Descreve a tua teoria..."
            {...register('motive')}
          />
          {errors.motive && (
            <p className="af-error"><AlertTriangle size={11} /> {errors.motive.message}</p>
          )}
        </div>

        {/* Method */}
        <div className="af-section">
          <label className="af-section-label">Método</label>
          <textarea
            className={clsx('af-textarea', errors.method && 'af-field-error')}
            rows={2}
            placeholder="Como foi cometido o crime?"
            {...register('method')}
          />
          {errors.method && (
            <p className="af-error"><AlertTriangle size={11} /> {errors.method.message}</p>
          )}
        </div>

        {/* Evidence selection */}
        <div className="af-section">
          <p className="af-section-label">
            Evidências que suportam a tua teoria
            <span className="af-evidence-count">({selectedEvidence.length} selecionadas)</span>
          </p>
          {evidence.length === 0 ? (
            <p className="af-evidence-empty">Nenhuma evidência desbloqueada.</p>
          ) : (
            <div className="af-evidence-list">
              {evidence.map((eu) => {
                const isChecked = selectedEvidence.includes(eu.evidenceId)
                return (
                  <motion.label
                    key={eu.id}
                    whileHover={{ x: 2 }}
                    className={clsx('af-evidence-item', isChecked && 'af-evidence-checked')}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleEvidence(eu.evidenceId)}
                      className="af-checkbox"
                    />
                    <div className="af-evidence-info">
                      <span className="af-evidence-title">{eu.evidence.title}</span>
                      <span className="af-evidence-type">{eu.evidence.type}</span>
                    </div>
                  </motion.label>
                )
              })}
            </div>
          )}
          {errors.evidenceCited && (
            <p className="af-error"><AlertTriangle size={11} /> {errors.evidenceCited.message}</p>
          )}
        </div>

        {/* Submit */}
        <motion.button
          type="submit"
          disabled={submitting}
          whileHover={{ scale: submitting ? 1 : 1.01 }}
          whileTap={{ scale: submitting ? 1 : 0.99 }}
          className="af-submit"
        >
          {submitting
            ? <><Loader2 size={16} className="af-spin" /> A submeter acusação...</>
            : <><Scale size={16} /> Submeter Acusação Final</>
          }
        </motion.button>
      </form>

      <style jsx>{`
        .af-root { max-width: 680px; margin: 0 auto; }

        .af-header { display: flex; align-items: flex-start; gap: 16px; margin-bottom: 28px; }
        .af-header-icon { width: 48px; height: 48px; border-radius: 10px; background: rgba(192,57,43,0.1); border: 1px solid rgba(192,57,43,0.2); display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 4px; }
        .af-eyebrow { font-family: monospace; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: #C0392B; margin-bottom: 4px; }
        .af-title { font-size: 26px; font-weight: 700; color: #E8E4DC; letter-spacing: -0.02em; margin-bottom: 4px; }
        .af-sub   { font-size: 13px; color: #666; }

        .af-result { display: flex; gap: 12px; padding: 14px 16px; border-radius: 8px; margin-bottom: 24px; }
        .af-result-correct { background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.25); color: #4ade80; }
        .af-result-wrong   { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); color: #f87171; }
        .af-result svg { flex-shrink: 0; margin-top: 2px; }
        .af-result-title { font-size: 13px; font-weight: 600; margin-bottom: 3px; }
        .af-result-text  { font-size: 12px; opacity: 0.8; line-height: 1.5; }

        .af-form { display: flex; flex-direction: column; gap: 22px; }

        .af-section { display: flex; flex-direction: column; gap: 10px; }
        .af-section-label { font-family: monospace; font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: #555; display: flex; align-items: center; gap: 8px; }
        .af-evidence-count { color: #C0392B; }

        .af-suspects { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; }
        .af-suspect {
          display: flex; flex-direction: column; align-items: center; gap: 8px;
          padding: 14px 10px;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s;
          text-align: center;
        }
        .af-suspect:hover { border-color: rgba(255,255,255,0.14); background: rgba(255,255,255,0.02); }
        .af-suspect-selected { border-color: rgba(192,57,43,0.5) !important; background: rgba(192,57,43,0.07) !important; }
        .af-suspect-avatar {
          width: 50px; height: 50px; border-radius: 50%;
          background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(255,255,255,0.08);
          display: flex; align-items: center; justify-content: center;
          overflow: hidden; position: relative; flex-shrink: 0;
        }
        .af-suspect-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .af-suspect-avatar span { font-size: 20px; font-weight: 700; color: #888; }
        .af-suspect-check {
          position: absolute; bottom: -2px; right: -2px;
          width: 18px; height: 18px; border-radius: 50%;
          background: #C0392B; display: flex; align-items: center; justify-content: center;
        }
        .af-suspect-name { font-size: 12px; font-weight: 600; color: #CCC; }
        .af-suspect-desc { font-size: 10px; color: #555; line-height: 1.4; }
        .af-suspect-selected .af-suspect-name { color: #E8E4DC; }

        .af-suspect-detail { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 16px; overflow: hidden; }
        .af-suspect-detail-text { font-size: 13px; color: #888; line-height: 1.65; margin-bottom: 12px; }
        .af-suspect-detail-row { display: grid; grid-template-columns: 1fr; gap: 10px; }
        .af-detail-micro { font-family: monospace; font-size: 9px; letter-spacing: 0.15em; text-transform: uppercase; color: #555; display: block; margin-bottom: 3px; }
        .af-detail-val { font-size: 12px; color: #999; line-height: 1.5; }

        .af-textarea {
          width: 100%;
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 6px;
          padding: 12px 14px;
          font-size: 13px;
          color: #CCC;
          font-family: Georgia, serif;
          line-height: 1.6;
          resize: vertical;
          outline: none;
          transition: border-color 0.15s;
        }
        .af-textarea::placeholder { color: #333; }
        .af-textarea:focus { border-color: rgba(192,57,43,0.35); }
        .af-field-error { border-color: rgba(239,68,68,0.4) !important; }

        .af-evidence-empty { font-size: 12px; color: #444; font-style: italic; }
        .af-evidence-list { display: flex; flex-direction: column; gap: 4px; }
        .af-evidence-item {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 12px;
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .af-evidence-item:hover { background: rgba(255,255,255,0.02); border-color: rgba(255,255,255,0.1); }
        .af-evidence-checked { background: rgba(192,57,43,0.06) !important; border-color: rgba(192,57,43,0.25) !important; }
        .af-checkbox {
          width: 15px; height: 15px; flex-shrink: 0;
          accent-color: #C0392B; cursor: pointer;
        }
        .af-evidence-info { display: flex; flex-direction: column; min-width: 0; }
        .af-evidence-title { font-size: 13px; color: #CCC; }
        .af-evidence-type  { font-family: monospace; font-size: 9px; color: #555; text-transform: uppercase; letter-spacing: 0.1em; }

        .af-error { display: flex; align-items: center; gap: 5px; font-size: 11px; color: #f87171; }

        .af-submit {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          width: 100%; padding: 16px;
          background: linear-gradient(135deg, #8B0000, #C0392B);
          color: #fff;
          border: none; border-radius: 8px;
          font-size: 14px; font-family: Georgia, serif; font-weight: 600;
          letter-spacing: 0.02em;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .af-submit:hover:not(:disabled) { opacity: 0.9; }
        .af-submit:disabled { opacity: 0.5; cursor: not-allowed; }
        .af-spin { animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
