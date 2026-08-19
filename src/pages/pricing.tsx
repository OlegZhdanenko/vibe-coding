import { Check, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Reveal, Section, SectionHeading } from '@/components/common/section'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useAuth } from '@/features/auth/auth-context'
import { UpgradeDialog } from '@/features/billing/upgrade-dialog'
import { PLANS, yearlySavings, type Plan } from '@/lib/plans'
import { cn } from '@/lib/utils'

const BILLING_FAQ = [
  {
    question: 'Is this a real payment flow?',
    answer:
      'No. Stripe is not integrated — the assignment asked for the flow rather than the integration. Confirming the upgrade moves your account onto the plan so you can see the quota lift, but no card is collected and nothing is charged.',
  },
  {
    question: 'What counts as a generation?',
    answer:
      'One completed draft. Regenerating the same topic counts again, because it is a second call to the model.',
  },
  {
    question: 'Can I go back to the free plan?',
    answer:
      'Yes. Your plan is a field on your profile — switch back at any time from this page, and the free-plan quota applies again.',
  },
]

export default function PricingPage() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [yearly, setYearly] = useState(false)
  const [selected, setSelected] = useState<Plan | null>(null)

  const handleChoose = (plan: Plan) => {
    if (!user) {
      navigate('/signup')
      return
    }
    setSelected(plan)
  }

  return (
    <>
      <Section className="pb-8">
        <SectionHeading
          eyebrow="Pricing"
          title="Pay for it once you know it helps"
          description="Start free with ten generations. Upgrade when writing emails stops being the slow part of your day."
        />

        <div className="mt-8 flex items-center justify-center gap-3">
          <Label htmlFor="billing-toggle" className={cn(!yearly && 'font-semibold')}>
            Monthly
          </Label>
          <Switch
            id="billing-toggle"
            checked={yearly}
            onCheckedChange={setYearly}
            aria-label="Toggle yearly billing"
          />
          <Label htmlFor="billing-toggle" className={cn(yearly && 'font-semibold')}>
            Yearly
          </Label>
          <Badge variant="secondary">2 months free</Badge>
        </div>
      </Section>

      <Section className="pt-0">
        <div className="grid gap-6 lg:grid-cols-3">
          {PLANS.map((plan, index) => {
            const price = yearly ? plan.yearlyPrice : plan.monthlyPrice
            const savings = yearlySavings(plan)
            const isCurrent = profile?.plan === plan.id

            return (
              <Reveal key={plan.id} delay={index * 0.08}>
                <Card
                  className={cn(
                    'relative flex h-full flex-col',
                    plan.highlighted && 'border-primary shadow-lg lg:scale-[1.03]',
                  )}
                >
                  {plan.highlighted ? (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 gap-1">
                      <Sparkles className="size-3" aria-hidden="true" />
                      Most popular
                    </Badge>
                  ) : null}

                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {plan.name}
                      {isCurrent ? (
                        <Badge variant="outline" className="font-normal">
                          Current
                        </Badge>
                      ) : null}
                    </CardTitle>
                    <CardDescription className="text-pretty">{plan.tagline}</CardDescription>

                    <p className="mt-4">
                      <span className="text-4xl font-semibold tracking-tight">${price}</span>
                      <span className="text-muted-foreground text-sm">
                        {plan.monthlyPrice === 0 ? ' forever' : yearly ? '/year' : '/month'}
                      </span>
                    </p>
                    {yearly && savings > 0 ? (
                      <p className="text-success text-xs font-medium">Saves ${savings} a year</p>
                    ) : null}
                  </CardHeader>

                  <CardContent className="flex flex-1 flex-col">
                    <ul className="flex-1 space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-sm">
                          <Check className="text-success mt-0.5 size-4 shrink-0" aria-hidden="true" />
                          <span className="text-pretty">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      className="mt-6 w-full"
                      variant={plan.highlighted ? 'default' : 'outline'}
                      disabled={isCurrent}
                      onClick={() => handleChoose(plan)}
                    >
                      {isCurrent
                        ? 'Your current plan'
                        : plan.id === 'free'
                          ? 'Switch to Free'
                          : `Upgrade to ${plan.name}`}
                    </Button>
                  </CardContent>
                </Card>
              </Reveal>
            )
          })}
        </div>
      </Section>

      <Section className="bg-muted/30">
        <SectionHeading title="Billing questions" />
        <div className="mx-auto mt-10 max-w-3xl">
          <Accordion type="single" collapsible>
            {BILLING_FAQ.map((item, index) => (
              <AccordionItem key={item.question} value={`billing-${index}`}>
                <AccordionTrigger className="text-left text-base">{item.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm text-pretty">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Section>

      {selected ? (
        <UpgradeDialog
          key={selected.id}
          plan={selected}
          billing={yearly ? 'yearly' : 'monthly'}
          onOpenChange={(open) => !open && setSelected(null)}
        />
      ) : null}
    </>
  )
}
