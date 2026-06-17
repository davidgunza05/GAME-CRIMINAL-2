'use client'

import { useEffect, use } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useCapturePaypal } from '@/hooks/useShop'

export default function PaypalSuccessPage() {
  const searchParams = useSearchParams()
  const capturePaypal = useCapturePaypal()

  const token = searchParams.get('token') // PayPal order ID
  const paymentId = searchParams.get('paymentId')

  useEffect(() => {
    if (token && paymentId && !capturePaypal.isPending && !capturePaypal.isSuccess) {
      capturePaypal.mutate({ paypalOrderId: token, paymentId })
    }
  }, [token, paymentId])

  return (
    <div className="min-h-screen bg-crime-black flex items-center justify-center">
      <div className="text-center">
        <Loader2 size={40} className="text-crime-red animate-spin mx-auto mb-4" />
        <p className="text-crime-text-muted">A confirmar pagamento PayPal...</p>
      </div>
    </div>
  )
}
