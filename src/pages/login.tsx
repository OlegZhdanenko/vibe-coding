import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/features/auth/auth-context'
import { ConfigNotice } from '@/features/auth/config-notice'
import { PasswordInput } from '@/features/auth/password-input'
import { signInSchema, type SignInValues } from '@/features/auth/schemas'
import { isSupabaseConfigured } from '@/lib/env'
import { toUserMessage } from '@/lib/errors'

export default function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [formError, setFormError] = useState<string | null>(null)

  // Where the guard bounced the user from, so we can send them back.
  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/dashboard'

  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (values: SignInValues) => {
    setFormError(null)
    try {
      await signIn(values)
      toast.success('Welcome back')
      navigate(redirectTo, { replace: true })
    } catch (error) {
      setFormError(toUserMessage(error))
    }
  }

  const submitting = form.formState.isSubmitting

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-muted-foreground mt-1.5 text-sm">
          Sign in to keep drafting. No account?{' '}
          <Link to="/signup" className="text-primary font-medium hover:underline">
            Create one
          </Link>
        </p>
      </div>

      <ConfigNotice />

      {formError ? (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    autoComplete="email"
                    placeholder="you@company.com"
                    disabled={submitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <PasswordInput
                    {...field}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    disabled={submitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={submitting || !isSupabaseConfigured}>
            {submitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </Form>
    </div>
  )
}
