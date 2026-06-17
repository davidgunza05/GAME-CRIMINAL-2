import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Crime Game — Plataforma de Investigação Criminal Imersiva',
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-crime-black flex flex-col">
      {/* Ambient glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(192,57,43,0.12) 0%, transparent 65%)',
        }}
      />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 border-b border-crime-border/50">
        <div className="flex items-center gap-3">
          <span className="text-xl">🔍</span>
          <span className="font-mono text-xs tracking-[0.25em] uppercase text-crime-text-muted">
            Crime Game
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth/login" className="btn-ghost text-sm py-2">
            Login
          </Link>
          <Link href="/auth/register" className="btn-primary text-sm py-2">
            Criar Conta
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 text-center py-24">
        <p className="text-xs font-mono tracking-[0.4em] uppercase text-crime-red mb-6 animate-fade-in">
          Plataforma de Investigação Criminal
        </p>

        <h1 className="text-5xl md:text-7xl font-bold text-crime-text-primary mb-6 leading-tight animate-slide-up">
          Resolve o Crime.
          <br />
          <span className="text-crime-red">Descobre o Culpado.</span>
        </h1>

        <p className="text-lg text-crime-text-muted max-w-xl mb-12 leading-relaxed animate-slide-up">
          Investiga casos criminais imersivos, interroga suspeitos, analisa evidências e
          chega à verdade antes que o tempo acabe.
        </p>

        <div className="flex flex-wrap gap-4 justify-center animate-slide-up">
          <Link href="/auth/register" className="btn-primary px-8 py-4 text-base">
            Começar a Investigar
          </Link>
          <Link href="/auth/login" className="btn-secondary px-8 py-4 text-base">
            Já tenho conta
          </Link>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 max-w-3xl w-full">
          {[
            {
              icon: '🎭',
              title: 'Roleplay Estruturado',
              desc: 'Assume um papel, guarda os teus segredos e engana os outros jogadores.',
            },
            {
              icon: '🔎',
              title: 'Evidências Dinâmicas',
              desc: 'Documentos, fotos, áudios e QR codes desbloqueados progressivamente.',
            },
            {
              icon: '👥',
              title: 'Multiplayer Real',
              desc: 'Joga com amigos online ou em eventos presenciais com kits físicos.',
            },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="card p-6 text-left">
              <div className="text-3xl mb-4">{icon}</div>
              <h3 className="text-sm font-bold text-crime-text-primary mb-2">{title}</h3>
              <p className="text-xs text-crime-text-muted leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center border-t border-crime-border/50">
        <p className="text-xs text-crime-text-faint font-mono tracking-widest">
          © {new Date().getFullYear()} CRIME GAME · TODOS OS DIREITOS RESERVADOS
        </p>
      </footer>
    </div>
  )
}
