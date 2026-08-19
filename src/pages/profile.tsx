import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, LogOut, Mail, Shield, Sparkles, User } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/features/auth/auth-context'
import { mapAuthError } from '@/features/auth/auth-errors'
import { PasswordInput } from '@/features/auth/password-input'
import { toUserMessage } from '@/lib/errors'
import { FREE_PLAN_LIMIT, planById } from '@/lib/plans'
import { requireSupabase } from '@/lib/supabase'

const profileSchema = z.object({
  fullName: z.string().trim().min(2, 'Please enter your name').max(80, 'That name is too long'),
})

const passwordSchema = z.object({
  password: z
    .string()
    .min(8, 'Use at least 8 characters')
    .max(72, 'Passwords are limited to 72 characters')
    .regex(/[a-zA-Z]/, 'Include at least one letter')
    .regex(/[0-9]/, 'Include at least one number'),
})

export default function ProfilePage() {
  const { user, profile, updateProfile, signOut } = useAuth()
  const navigate = useNavigate()

  const plan = planById(profile?.plan ?? 'free')
  const used = profile?.generations_used ?? 0
  const isFree = (profile?.plan ?? 'free') === 'free'

  const nameForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    values: { fullName: profile?.full_name ?? '' },
  })

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: '' },
  })

  const handleNameSubmit = nameForm.handleSubmit(async ({ fullName }) => {
    try {
      await updateProfile({ full_name: fullName })
      toast.success('Profile updated')
    } catch (error) {
      toast.error(toUserMessage(error))
    }
  })

  const handlePasswordSubmit = passwordForm.handleSubmit(async ({ password }) => {
    try {
      const client = requireSupabase()
      const { error } = await client.auth.updateUser({ password })
      if (error) throw mapAuthError(error)
      passwordForm.reset({ password: '' })
      toast.success('Password changed')
    } catch (error) {
      toast.error(toUserMessage(error))
    }
  })

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/')
    } catch (error) {
      toast.error(toUserMessage(error))
    }
  }

  const initials =
    (profile?.full_name ?? user?.email ?? '?')
      .split(/[\s._@-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]!.toUpperCase())
      .join('') || '?'

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex flex-wrap items-center gap-4">
        <Avatar className="size-16">
          <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold tracking-tight">
            {profile?.full_name ?? 'Your profile'}
          </h1>
          <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
            <Mail className="size-3.5" aria-hidden="true" />
            <span className="truncate">{user?.email}</span>
          </p>
        </div>
      </header>

      {/* ------------------------------------------------------------ Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="size-4" aria-hidden="true" />
            Plan and usage
          </CardTitle>
          <CardDescription>What your account is allowed to do right now.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Badge variant={isFree ? 'secondary' : 'default'} className="capitalize">
                {plan.name}
              </Badge>
              <span className="text-muted-foreground text-sm">{plan.tagline}</span>
            </div>
            <Button variant={isFree ? 'default' : 'outline'} size="sm" asChild>
              <Link to="/pricing">{isFree ? 'Upgrade' : 'Change plan'}</Link>
            </Button>
          </div>

          <Separator />

          {isFree ? (
            <div className="space-y-2">
              <div className="flex items-baseline justify-between text-sm">
                <span>Generations this month</span>
                <span className="text-muted-foreground tabular-nums">
                  {Math.min(used, FREE_PLAN_LIMIT)} / {FREE_PLAN_LIMIT}
                </span>
              </div>
              <Progress value={(Math.min(used, FREE_PLAN_LIMIT) / FREE_PLAN_LIMIT) * 100} />
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              {used} generation{used === 1 ? '' : 's'} so far. No limit on this plan.
            </p>
          )}
        </CardContent>
      </Card>

      {/* ------------------------------------------------------- Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="size-4" aria-hidden="true" />
            Your details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...nameForm}>
            <form onSubmit={handleNameSubmit} className="space-y-4" noValidate>
              <FormField
                control={nameForm.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full name</FormLabel>
                    <FormControl>
                      <Input {...field} autoComplete="name" />
                    </FormControl>
                    <FormDescription>Used to greet you in the dashboard.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={nameForm.formState.isSubmitting}>
                {nameForm.formState.isSubmitting ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : null}
                Save changes
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* ------------------------------------------------------- Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="size-4" aria-hidden="true" />
            Security
          </CardTitle>
          <CardDescription>Change the password used to sign in.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form onSubmit={handlePasswordSubmit} className="space-y-4" noValidate>
              <FormField
                control={passwordForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New password</FormLabel>
                    <FormControl>
                      <PasswordInput {...field} autoComplete="new-password" placeholder="••••••••" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" variant="outline" disabled={passwordForm.formState.isSubmitting}>
                {passwordForm.formState.isSubmitting ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : null}
                Change password
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* --------------------------------------------------------- Session */}
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 py-5">
          <div>
            <p className="text-sm font-medium">Sign out</p>
            <p className="text-muted-foreground text-sm">End this session on this device.</p>
          </div>
          <Button variant="outline" onClick={() => void handleSignOut()}>
            <LogOut className="size-4" aria-hidden="true" />
            Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
