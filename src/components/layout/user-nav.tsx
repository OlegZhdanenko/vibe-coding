import { LayoutDashboard, LogOut, Sparkles, User as UserIcon } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/features/auth/auth-context'
import { toUserMessage } from '@/lib/errors'

/** Derive up to two initials from a display name or, failing that, an email. */
function initialsOf(name: string | null | undefined, email: string | undefined) {
  const source = name?.trim() || email?.split('@')[0] || '?'
  return source
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('')
}

export function UserNav() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState(false)

  if (!user) return null

  const displayName = profile?.full_name ?? (user.user_metadata.full_name as string | undefined)
  const isPro = profile?.plan && profile.plan !== 'free'

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await signOut()
      toast.success('Signed out')
      navigate('/')
    } catch (error) {
      toast.error(toUserMessage(error))
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-9 gap-2 px-2" aria-label="Open account menu">
          <Avatar className="size-7">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {initialsOf(displayName, user.email)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden max-w-32 truncate text-sm sm:inline">
            {displayName ?? user.email}
          </span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="flex flex-col gap-1">
          <span className="truncate font-medium">{displayName ?? 'Your account'}</span>
          <span className="text-muted-foreground truncate text-xs font-normal">{user.email}</span>
          <Badge variant={isPro ? 'default' : 'secondary'} className="mt-1 w-fit capitalize">
            {isPro ? <Sparkles className="size-3" aria-hidden="true" /> : null}
            {profile?.plan ?? 'free'} plan
          </Badge>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem onSelect={() => navigate('/dashboard')}>
          <LayoutDashboard className="size-4" aria-hidden="true" />
          Dashboard
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navigate('/profile')}>
          <UserIcon className="size-4" aria-hidden="true" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navigate('/pricing')}>
          <Sparkles className="size-4" aria-hidden="true" />
          Plans &amp; billing
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          variant="destructive"
          disabled={signingOut}
          onSelect={(event) => {
            event.preventDefault()
            void handleSignOut()
          }}
        >
          <LogOut className="size-4" aria-hidden="true" />
          {signingOut ? 'Signing out…' : 'Sign out'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
