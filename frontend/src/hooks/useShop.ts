import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { useCartStore } from '@/store/cart.store'

// ─── Cases ────────────────────────────────────────────────────────────────────

export const useCases = (params: Record<string, any> = {}) => {
  return useQuery({
    queryKey: ['cases', params],
    queryFn: async () => {
      const query = new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined && v !== '' && v !== null)
          .map(([k, v]) => [k, String(v)])
      ).toString()
      const res = await api.get(`/cases${query ? `?${query}` : ''}`)
      return res.data.data
    },
    staleTime: 60 * 1000,
  })
}

export const useFeaturedCases = () => {
  return useQuery({
    queryKey: ['cases', 'featured'],
    queryFn: async () => {
      const res = await api.get('/cases/featured')
      return res.data.data.cases
    },
    staleTime: 5 * 60 * 1000,
  })
}

export const useCaseBySlug = (slug: string) => {
  return useQuery({
    queryKey: ['cases', slug],
    queryFn: async () => {
      const res = await api.get(`/cases/${slug}`)
      return res.data.data.case
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  })
}

export const useCaseTags = () => {
  return useQuery({
    queryKey: ['cases', 'tags'],
    queryFn: async () => {
      const res = await api.get('/cases/tags')
      return res.data.data.tags as string[]
    },
    staleTime: 10 * 60 * 1000,
  })
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export const useMyOrders = (page = 1) => {
  return useQuery({
    queryKey: ['orders', 'my', page],
    queryFn: async () => {
      const res = await api.get(`/orders/my?page=${page}`)
      return res.data.data
    },
  })
}

export const useMyOrder = (id: string) => {
  return useQuery({
    queryKey: ['orders', 'my', id],
    queryFn: async () => {
      const res = await api.get(`/orders/my/${id}`)
      return res.data.data.order
    },
    enabled: !!id,
  })
}

export const useCreateOrder = () => {
  const clearCart = useCartStore((s) => s.clearCart)
  const router = useRouter()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/orders', data)
      return res.data.data.order
    },
    onSuccess: (order) => {
      clearCart()
      // Invalidar acesso para reflectir estado correcto antes de pagar
      queryClient.invalidateQueries({ queryKey: ['cases', 'my-access'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      router.push(`/checkout/${order.id}`)
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Erro ao criar encomenda')
    },
  })
}

export const useValidateCoupon = () => {
  return useMutation({
    mutationFn: async ({ code, orderAmount }: { code: string; orderAmount: number }) => {
      const res = await api.post('/orders/coupons/validate', { code, orderAmount })
      return res.data.data
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Cupão inválido')
    },
  })
}

// ─── Stripe ───────────────────────────────────────────────────────────────────

export const useStripePaymentIntent = () => {
  return useMutation({
    mutationFn: async (orderId: string) => {
      const res = await api.post('/orders/payments/stripe/create-intent', { orderId })
      return res.data.data
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Erro ao iniciar pagamento Stripe')
    },
  })
}

// ─── Confirmar pagamento Stripe (sandbox + prod sem webhook) ─────────────────

export const useConfirmStripePayment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { paymentIntentId: string; paymentId: string }) => {
      const res = await api.post('/orders/payments/stripe/confirm', data)
      return res.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['cases', 'my-access'] })
    },
    onError: () => {},
  })
}

// ─── PayPal ───────────────────────────────────────────────────────────────────

export const usePaypalOrder = () => {
  return useMutation({
    mutationFn: async (orderId: string) => {
      const res = await api.post('/orders/payments/paypal/create-order', { orderId })
      return res.data.data
    },
    onSuccess: (data) => {
      if (data.approvalUrl) window.location.href = data.approvalUrl
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Erro ao iniciar pagamento PayPal')
    },
  })
}

export const useCapturePaypal = () => {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: async (data: { paypalOrderId: string; paymentId: string }) => {
      const res = await api.post('/orders/payments/paypal/capture', data)
      return res.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast.success('Pagamento confirmado!')
      router.push('/dashboard/orders')
    },
    onError: () => {
      toast.error('Erro ao confirmar pagamento PayPal')
    },
  })
}
