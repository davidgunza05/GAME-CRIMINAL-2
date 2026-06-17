'use client'

import Link from 'next/link'
import { XCircle } from 'lucide-react'

export default function PaypalCancelPage() {
  return (
    <div className="min-h-screen bg-crime-black flex items-center justify-center">
      <div className="text-center">
        <XCircle size={48} className="text-red-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-crime-text-primary mb-2">Pagamento Cancelado</h1>
        <p className="text-crime-text-muted text-sm mb-6">O pagamento foi cancelado. A tua encomenda foi guardada.</p>
        <div className="flex gap-3 justify-center">
          <Link href="/dashboard/orders" className="btn-secondary">Ver Encomendas</Link>
          <Link href="/dashboard/cases" className="btn-primary">Continuar</Link>
        </div>
      </div>
    </div>
  )
}
