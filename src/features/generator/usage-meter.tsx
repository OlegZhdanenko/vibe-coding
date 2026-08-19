import { Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { FREE_PLAN_LIMIT } from '@/lib/plans'
import type { ProfileRow } from '@/types/database'

/** Free-plan usage against the quota the endpoint actually enforces. */
export function UsageMeter({ profile }: { profile: ProfileRow | null }) {
  if (!profile) return null

  if (profile.plan !== 'free') {
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex items-center gap-3 py-4">
          <Sparkles className="text-primary size-5 shrink-0" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium capitalize">{profile.plan} plan</p>
            <p className="text-muted-foreground text-xs">Unlimited generations.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const used = Math.min(profile.generations_used, FREE_PLAN_LIMIT)
  const remaining = Math.max(FREE_PLAN_LIMIT - used, 0)
  const exhausted = remaining === 0

  return (
    <Card>
      <CardContent className="space-y-3 py-4">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-sm font-medium">Free plan</p>
          <p className="text-muted-foreground text-xs tabular-nums">
            {used} / {FREE_PLAN_LIMIT} used
          </p>
        </div>

        <Progress value={(used / FREE_PLAN_LIMIT) * 100} />

        <p className="text-muted-foreground text-xs text-pretty">
          {exhausted
            ? 'You have used every generation on the free plan.'
            : `${remaining} generation${remaining === 1 ? '' : 's'} left.`}
        </p>

        <Button
          asChild
          size="sm"
          variant={exhausted ? 'default' : 'outline'}
          className="w-full"
        >
          <Link to="/pricing">
            <Sparkles className="size-4" aria-hidden="true" />
            Upgrade
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
