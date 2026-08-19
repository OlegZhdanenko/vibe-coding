import { CheckCircle2, CreditCard, Loader2, Lock } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/features/auth/auth-context'
import { toUserMessage } from '@/lib/errors'
import type { Plan } from '@/lib/plans'

type Stage = 'review' | 'processing' | 'done'

interface UpgradeDialogProps {
  plan: Plan | null
  billing: 'monthly' | 'yearly'
  onOpenChange: (open: boolean) => void
}

/**
 * Mocked checkout.
 *
 * There is no payment processor behind this — the assignment calls for the
 * flow, not the integration. It is deliberately honest about that on screen,
 * while still doing the one real thing that matters: moving the account onto
 * the new plan so the quota actually lifts.
 */
export function UpgradeDialog({ plan, billing, onOpenChange }: UpgradeDialogProps) {
  const { user, profile, updateProfile } = useAuth()
  const navigate = useNavigate()
  const [stage, setStage] = useState<Stage>('review')
  const [error, setError] = useState<string | null>(null)

  // The caller keys this component by plan id, so switching plans remounts it
  // with a fresh stage rather than inheriting the previous outcome.
  if (!plan) return null

  const price = billing === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice
  const period = billing === 'yearly' ? 'year' : 'month'
  const alreadyOnPlan = profile?.plan === plan.id

  const handleConfirm = async () => {
    if (!user) {
      navigate('/signup')
      return
    }

    setStage('processing')
    setError(null)
    try {
      // Stands in for the round trip to a payment provider.
      await new Promise((resolve) => setTimeout(resolve, 1400))
      await updateProfile({ plan: plan.id })
      setStage('done')
      toast.success(`You are on the ${plan.name} plan`)
    } catch (caught) {
      setStage('review')
      setError(toUserMessage(caught))
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onOpenChange(false)}>
      <DialogContent className="sm:max-w-md">
        {stage === 'done' ? (
          <>
            <DialogHeader>
              <div className="bg-success/10 text-success mx-auto flex size-12 items-center justify-center rounded-full">
                <CheckCircle2 className="size-6" aria-hidden="true" />
              </div>
              <DialogTitle className="text-center">Welcome to {plan.name}</DialogTitle>
              <DialogDescription className="text-center">
                Your account has been upgraded. Unlimited generations are available right away.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button className="w-full" onClick={() => navigate('/dashboard')}>
                Start writing
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Upgrade to {plan.name}</DialogTitle>
              <DialogDescription>{plan.tagline}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex items-baseline justify-between">
                <span className="text-sm">
                  {plan.name}, billed {billing}
                </span>
                <span className="text-lg font-semibold">
                  ${price}
                  <span className="text-muted-foreground text-sm font-normal">/{period}</span>
                </span>
              </div>

              <Separator />

              <ul className="space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="text-success mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Alert>
                <Lock className="size-4" aria-hidden="true" />
                <AlertDescription>
                  This is a demo checkout. No payment provider is connected and no card details are
                  collected — confirming simply moves your account onto the plan.
                </AlertDescription>
              </Alert>

              {error ? (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}
            </div>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={() => void handleConfirm()} disabled={stage === 'processing' || alreadyOnPlan}>
                {stage === 'processing' ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <CreditCard className="size-4" aria-hidden="true" />
                )}
                {alreadyOnPlan
                  ? 'Already your plan'
                  : stage === 'processing'
                    ? 'Processing…'
                    : `Confirm — $${price}/${period}`}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
