'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, ShoppingBag, Gamepad2, Trophy,
  Settings, LogOut, Shield, ChevronRight, Loader2, Package
} from 'lucide-react'
import { clsx } from 'clsx'
import { useAuthStore } from '@/store/auth.store'
import { useLogout } from '@/hooks/useAuth'
import CartButton from '@/components/shop/CartButton'

const navItems = [
  { href: '/dashboard', label: 'Início', icon: LayoutDashboard },
  { href: '/dashboard/cases', label: 'Casos', icon: ShoppingBag },
  { href: '/dashboard/orders', label: 'Encomendas', icon: Package },
  { href: '/dashboard/sessions', label: 'Sessões', icon: Gamepad2 },
  { href: '/dashboard/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/dashboard/settings', label: 'Definições', icon: Settings },
]

const adminItems = [
  { href: '/dashboard/admin', label: 'Utilizadores', icon: Shield },
  { href: '/dashboard/admin/cases', label: 'Casos', icon: ShoppingBag },
  { href: '/dashboard/admin/orders', label: 'Encomendas', icon: Package },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()
  const logout = useLogout()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-crime-black flex items-center justify-center">
        <Loader2 size={32} className="text-crime-red animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) return null

  return (
    <div className="min-h-screen bg-crime-black flex">
      {/* Sidebar */}
      <aside className="w-64 bg-crime-surface border-r border-crime-border flex flex-col shrink-0">
        {/* Logo */}
        <div className="p-6 border-b border-crime-border">
          <div className="flex items-center justify-between w-full"><Link href="/dashboard" className="flex items-center gap-3">
            <span className="text-xl">🔍</span>
            <span className="font-mono text-xs tracking-[0.2em] uppercase text-crime-text-muted">
              Crime Game
            </span>
          </Link>
        </div>

        {/* User info */}
        <div className="p-4 border-b border-crime-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-crime-red/20 border border-crime-red/30 flex items-center justify-center text-crime-red font-bold text-sm">
              {user?.displayName?.[0]?.toUpperCase() || user?.username[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-crime-text-primary truncate">
                {user?.displayName || user?.username}
              </p>
              <span className={clsx(
                'badge text-[10px]',
                user?.role === 'admin' && 'badge-admin',
                user?.role === 'organizer' && 'badge-organizer',
                user?.role === 'player' && 'badge-player',
              )}>
                {user?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all group',
                  active
                    ? 'bg-crime-red/15 text-crime-red border border-crime-red/20'
                    : 'text-crime-text-muted hover:text-crime-text-primary hover:bg-crime-muted/30'
                )}
              >
                <Icon size={16} />
                <span className="flex-1">{label}</span>
                {active && <ChevronRight size={14} />}
              </Link>
            )
          })}

          {/* Admin section */}
          {user?.role === 'admin' && (
            <>
              <div className="pt-4 pb-1 px-3">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-crime-text-faint">
                  Administração
                </span>
              </div>
              {adminItems.map(({ href, label, icon: Icon }) => {
                const active = pathname.startsWith(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    className={clsx(
                      'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all',
                      active
                        ? 'bg-crime-red/15 text-crime-red border border-crime-red/20'
                        : 'text-crime-text-muted hover:text-crime-text-primary hover:bg-crime-muted/30'
                    )}
                  >
                    <Icon size={16} />
                    {label}
                  </Link>
                )
              })}
            </>
          )}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-crime-border">
          <button
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-crime-text-faint hover:text-red-400 hover:bg-red-950/30 transition-all w-full"
          >
            {logout.isPending
              ? <Loader2 size={16} className="animate-spin" />
              : <LogOut size={16} />
            }
            Terminar Sessão
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
