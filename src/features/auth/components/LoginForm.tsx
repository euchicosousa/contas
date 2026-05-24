import * as React from 'react'
import { useForm } from '@tanstack/react-form'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { authService } from '../services/auth.service'
import { createClient } from '#/integrations/supabase/client'

export function LoginForm() {
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)
  const supabase = createClient()

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    onSubmit: async ({ value }) => {
      setErrorMsg(null)
      try {
        await authService.signInWithPassword(supabase, value)
        window.location.href = '/dashboard'
      } catch (err: any) {
        setErrorMsg(err.message || 'Erro ao fazer login')
      }
    },
  })

  return (
    <div className="mx-auto w-full max-w-sm space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Bem-vindo de volta</h1>
        <p className="text-muted-foreground text-sm">
          Insira seu email e senha para acessar sua conta
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit()
        }}
        className="space-y-4"
      >
        <div className="space-y-4">
          <form.Field
            name="email"
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Email</Label>
                <Input
                  id={field.name}
                  type="email"
                  placeholder="seu@email.com"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  disabled={form.state.isSubmitting}
                />
              </div>
            )}
          />

          <form.Field
            name="password"
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Senha</Label>
                <Input
                  id={field.name}
                  type="password"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  disabled={form.state.isSubmitting}
                />
              </div>
            )}
          />
        </div>

        {errorMsg && (
          <div className="bg-destructive/15 text-destructive rounded-md p-3 text-sm">
            {errorMsg}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={form.state.isSubmitting}>
          {form.state.isSubmitting ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>
    </div>
  )
}
