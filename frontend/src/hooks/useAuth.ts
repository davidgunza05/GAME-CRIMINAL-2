import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'

// ─── Register ─────────────────────────────────────────────────────────────────

export const useRegister = () => {
  const router = useRouter()

  return useMutation({
    mutationFn: async (data: {
      email: string
      username: string
      password: string
      displayName?: string
    }) => {
      const res = await api.post('/auth/register', data)
      return res.data
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Conta criada! Verifica o teu email.')
      router.push('/auth/verify-email-sent')
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Erro ao criar conta'
      toast.error(msg)
    },
  })
}

// ─── Login ────────────────────────────────────────────────────────────────────

export const useLogin = () => {
  const setAuth = useAuthStore((s) => s.setAuth)
  const router = useRouter()

  return useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const res = await api.post('/auth/login', data)
      return res.data
    },
    onSuccess: (data) => {
      const { user, accessToken } = data.data
      setAuth(user, accessToken)
      toast.success(`Bem-vindo, Detetive ${user.username}!`)
      router.push('/dashboard')
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Erro ao fazer login'
      toast.error(msg)
    },
  })
}

// ─── Logout ───────────────────────────────────────────────────────────────────

export const useLogout = () => {
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const router = useRouter()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await api.post('/auth/logout')
    },
    onSettled: () => {
      clearAuth()
      queryClient.clear()
      router.push('/auth/login')
      toast.success('Sessão encerrada')
    },
  })
}

// ─── Verify Email ─────────────────────────────────────────────────────────────

export const useVerifyEmail = () => {
  const router = useRouter()

  return useMutation({
    mutationFn: async (token: string) => {
      const res = await api.post('/auth/verify-email', { token })
      return res.data
    },
    onSuccess: () => {
      toast.success('Email verificado! Podes fazer login.')
      router.push('/auth/login?verified=1')
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Erro ao verificar email'
      toast.error(msg)
    },
  })
}

// ─── Resend Verification ──────────────────────────────────────────────────────

export const useResendVerification = () => {
  return useMutation({
    mutationFn: async (email: string) => {
      const res = await api.post('/auth/resend-verification', { email })
      return res.data
    },
    onSuccess: () => toast.success('Email de verificação enviado!'),
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Erro ao reenviar email'
      toast.error(msg)
    },
  })
}

// ─── Forgot Password ──────────────────────────────────────────────────────────

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: async (email: string) => {
      const res = await api.post('/auth/forgot-password', { email })
      return res.data
    },
    onSuccess: (data) => toast.success(data.message),
    onError: () => toast.error('Erro ao enviar email de recuperação'),
  })
}

// ─── Reset Password ───────────────────────────────────────────────────────────

export const useResetPassword = () => {
  const router = useRouter()

  return useMutation({
    mutationFn: async (data: { token: string; password: string }) => {
      const res = await api.post('/auth/reset-password', data)
      return res.data
    },
    onSuccess: () => {
      toast.success('Password redefinida! Podes fazer login.')
      router.push('/auth/login')
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Erro ao redefinir password'
      toast.error(msg)
    },
  })
}

// ─── Get Me ───────────────────────────────────────────────────────────────────

export const useMe = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const res = await api.get('/auth/me')
      return res.data.data.user
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  })
}
