'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Loader2, User, Lock, AtSign } from 'lucide-react'
import { FormField } from '@/components/ui/FormField'
import { useAuthStore } from '@/store/auth.store'
import api from '@/lib/api'

// ─── Profile schema ───────────────────────────────────────────────────────────
const profileSchema = z.object({
  displayName: z.string().min(2, 'Mínimo 2 caracteres').max(50).trim(),
  bio: z.string().max(300, 'Máximo 300 caracteres').trim().optional(),
})

// ─── Password schema ──────────────────────────────────────────────────────────
const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Obrigatório'),
  newPassword: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Precisa de maiúscula')
    .regex(/[a-z]/, 'Precisa de minúscula')
    .regex(/[0-9]/, 'Precisa de número'),
}).refine((d) => d.currentPassword !== d.newPassword, {
  message: 'A nova password deve ser diferente da atual',
  path: ['newPassword'],
})

// ─── Username schema ──────────────────────────────────────────────────────────
const usernameSchema = z.object({
  username: z
    .string()
    .min(3, 'Mínimo 3 caracteres')
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, 'Apenas letras, números e _')
    .toLowerCase(),
})

type ProfileForm = z.infer<typeof profileSchema>
type PasswordForm = z.infer<typeof passwordSchema>
type UsernameForm = z.infer<typeof usernameSchema>

function Section({ title, icon: Icon, children }: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
}) {
  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-crime-border">
        <Icon size={16} className="text-crime-red" />
        <h2 className="text-sm font-mono uppercase tracking-widest text-crime-text-secondary">{title}</h2>
      </div>
      {children}
    </div>
  )
}

export default function SettingsPage() {
  const { user, setUser } = useAuthStore()

  // ─── Profile form ─────────────────────────────────────────────────────────
  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { displayName: user?.displayName || '', bio: user?.bio || '' },
  })

  const updateProfile = useMutation({
    mutationFn: async (data: ProfileForm) => {
      const res = await api.patch('/users/me', data)
      return res.data.data.user
    },
    onSuccess: (updatedUser) => {
      setUser(updatedUser)
      toast.success('Perfil atualizado')
    },
    onError: () => toast.error('Erro ao atualizar perfil'),
  })

  // ─── Password form ────────────────────────────────────────────────────────
  const passwordForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) })

  const changePassword = useMutation({
    mutationFn: async (data: PasswordForm) => {
      await api.patch('/users/me/password', data)
    },
    onSuccess: () => {
      toast.success('Password alterada com sucesso')
      passwordForm.reset()
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Erro ao alterar password'
      toast.error(msg)
    },
  })

  // ─── Username form ────────────────────────────────────────────────────────
  const usernameForm = useForm<UsernameForm>({
    resolver: zodResolver(usernameSchema),
    defaultValues: { username: user?.username || '' },
  })

  const changeUsername = useMutation({
    mutationFn: async (data: UsernameForm) => {
      const res = await api.patch('/users/me/username', data)
      return res.data.data.user
    },
    onSuccess: (updatedUser) => {
      setUser(updatedUser)
      toast.success('Username alterado')
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Erro ao alterar username'
      toast.error(msg)
    },
  })

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <p className="text-xs font-mono tracking-[0.3em] uppercase text-crime-red mb-2">
          Conta
        </p>
        <h1 className="text-3xl font-bold text-crime-text-primary">Definições</h1>
      </div>

      <div className="space-y-6">
        {/* Profile */}
        <Section title="Perfil Público" icon={User}>
          <form
            onSubmit={profileForm.handleSubmit((d) => updateProfile.mutate(d))}
            className="space-y-4"
          >
            <FormField
              label="Nome de exibição"
              placeholder="O teu nome"
              error={profileForm.formState.errors.displayName?.message}
              {...profileForm.register('displayName')}
            />
            <div>
              <label className="label">Bio</label>
              <textarea
                className="input resize-none"
                rows={3}
                placeholder="Conta um pouco sobre ti..."
                {...profileForm.register('bio')}
              />
              {profileForm.formState.errors.bio && (
                <p className="field-error">{profileForm.formState.errors.bio.message}</p>
              )}
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={updateProfile.isPending}
                className="btn-primary"
              >
                {updateProfile.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
                Guardar Perfil
              </button>
            </div>
          </form>
        </Section>

        {/* Username */}
        <Section title="Username" icon={AtSign}>
          <form
            onSubmit={usernameForm.handleSubmit((d) => changeUsername.mutate(d))}
            className="space-y-4"
          >
            <FormField
              label="Username"
              placeholder="novo_username"
              error={usernameForm.formState.errors.username?.message}
              hint="Alterar o username pode afetar os teus links públicos."
              {...usernameForm.register('username')}
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={changeUsername.isPending}
                className="btn-secondary"
              >
                {changeUsername.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
                Alterar Username
              </button>
            </div>
          </form>
        </Section>

        {/* Password */}
        <Section title="Segurança" icon={Lock}>
          <form
            onSubmit={passwordForm.handleSubmit((d) => changePassword.mutate(d))}
            className="space-y-4"
          >
            <FormField
              label="Password Atual"
              type="password"
              placeholder="A tua password atual"
              error={passwordForm.formState.errors.currentPassword?.message}
              {...passwordForm.register('currentPassword')}
            />
            <FormField
              label="Nova Password"
              type="password"
              placeholder="Mínimo 8 caracteres"
              error={passwordForm.formState.errors.newPassword?.message}
              {...passwordForm.register('newPassword')}
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={changePassword.isPending}
                className="btn-danger"
              >
                {changePassword.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
                Alterar Password
              </button>
            </div>
          </form>
        </Section>
      </div>
    </div>
  )
}
