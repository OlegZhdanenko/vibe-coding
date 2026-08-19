import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/features/auth/auth-context'
import { ConfigNotice } from '@/features/auth/config-notice'
import { PasswordInput } from '@/features/auth/password-input'
import { signUpSchema, type SignUpValues } from '@/features/auth/schemas'
import { isSupabaseConfigured } from '@/lib/env'
import { toUserMessage } from '@/lib/errors'

export default function SignupPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [formError, setFormError] = useState<string | null>(null)
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false)

  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { fullName: '', email: '', password: '' },
  })

  const onSubmit = async (values: SignUpValues) => {
    setFormError(null)
    try {
      const { needsEmailConfirmation } = await signUp(values)

      if (needsEmailConfirmation) {
        // No session exists yet, so redirecting would just bounce off the auth
        // guard. Ask the user to open the link instead of hanging on a spinner.
        setAwaitingConfirmation(true)
        return
      }

      toast.success('Account created')
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setFormError(toUserMessage(error))
    }
  }

  const submitting = form.formState.isSubmitting

  if (awaitingConfirmation) {
    return (
      <div className="text-center">
        <CheckCircle2 className="text-success mx-auto size-10" aria-hidden="true" />
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">Check your inbox</h1>
        <p className="text-muted-foreground mt-2 text-sm text-pretty">
          We sent a confirmation link to <strong>{form.getValues('email')}</strong>. Open it to
          activate your account, then sign in.
        </p>
        <Button asChild className="mt-6 w-full">
          <Link to="/login">Go to sign in</Link>
        </Button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
        <p className="text-muted-foreground mt-1.5 text-sm">
          Already have one?{' '}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>

      <ConfigNotice />

      {formError ? (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Could not create your account</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    autoComplete="name"
                    placeholder="Ada Lovelace"
                    disabled={submitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
                    autoComplete="new-password"
                    placeholder="••••••••"
                    disabled={submitting}
                  />
                </FormControl>
                <FormDescription>At least 8 characters, with a letter and a number.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={submitting || !isSupabaseConfigured}>
            {submitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            {submitting ? 'Creating account…' : 'Create account'}
          </Button>

          <p className="text-muted-foreground text-center text-xs">
            By continuing you agree to the terms of this demo application.
          </p>
        </form>
      </Form>
    </div>
  )
}
