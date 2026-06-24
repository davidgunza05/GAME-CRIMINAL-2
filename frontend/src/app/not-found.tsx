import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-crime-black flex flex-col items-center justify-center px-4 text-center">
      {/* Ambient */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(192,57,43,0.08) 0%, transparent 65%)' }}
      />

      <div className="relative z-10 max-w-md">
        <p className="text-xs font-mono tracking-[0.4em] uppercase text-crime-red mb-6">
          Erro 404
        </p>

        <div className="text-8xl font-bold text-crime-text-primary/10 font-mono mb-4 select-none">
          404
        </div>

        <h1 className="text-2xl font-bold text-crime-text-primary mb-3">
          Pista Não Encontrada
        </h1>
        <p className="text-crime-text-muted text-sm leading-relaxed mb-8">
          A página que procuras desapareceu como um suspeito na noite.
          Pode ter sido movida, eliminada, ou nunca ter existido.
        </p>

        <div className="flex gap-3 justify-center flex-wrap">
          <Link href="/dashboard" className="btn-primary gap-2">
            🔍 Voltar ao Dashboard
          </Link>
          <Link href="/dashboard/cases" className="btn-secondary">
            Ver Casos
          </Link>
        </div>
      </div>
    </div>
  )
}
