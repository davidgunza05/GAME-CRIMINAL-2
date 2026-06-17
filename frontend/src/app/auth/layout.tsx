import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: { default: 'Autenticação', template: '%s — Crime Game' },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-crime-black flex flex-col">
      {/* Header mínimo */}
      <header className="py-6 px-8 flex justify-center">
        <Link href="/" className="flex items-center gap-3 group">
          <span className="text-2xl">🔍</span>
          <span className="font-mono text-sm tracking-[0.25em] uppercase text-crime-text-muted group-hover:text-crime-red transition-colors">
            Crime Game
          </span>
        </Link>
      </header>

      {/* Radial glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(192,57,43,0.08) 0%, transparent 60%)',
        }}
      />

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md animate-slide-up">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center">
        <p className="text-xs text-crime-text-faint font-mono tracking-widest">
          © {new Date().getFullYear()} CRIME GAME · TODOS OS DIREITOS RESERVADOS
        </p>
      </footer>
    </div>
  )
}
