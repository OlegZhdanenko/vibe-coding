import type { PlanId } from '@/types/database'

/**
 * Plan catalogue shared by the pricing page, the usage meter and the upgrade
 * flow. The free limit is duplicated in `server/generate-handler.ts`, which is
 * where it is actually enforced — this copy is for display only.
 */
export const FREE_PLAN_LIMIT = 10

export interface Plan {
  id: PlanId
  name: string
  tagline: string
  monthlyPrice: number
  yearlyPrice: number
  features: string[]
  highlighted?: boolean
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'Enough to see whether this fits how you write.',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      `${FREE_PLAN_LIMIT} generations per month`,
      'All nine tones and three lengths',
      'Six languages',
      'Draft history',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'For people who live in their inbox.',
    monthlyPrice: 12,
    yearlyPrice: 108,
    features: [
      'Unlimited generations',
      'Priority generation queue',
      'Longer, more detailed drafts',
      'Full searchable history',
      'Email support',
    ],
    highlighted: true,
  },
  {
    id: 'team',
    name: 'Team',
    tagline: 'Consistent voice across everyone who writes.',
    monthlyPrice: 29,
    yearlyPrice: 261,
    features: [
      'Everything in Pro',
      'Up to 10 seats',
      'Shared tone presets',
      'Team draft library',
      'Priority support',
    ],
  },
]

export function planById(id: PlanId): Plan {
  return PLANS.find((plan) => plan.id === id) ?? PLANS[0]!
}

/** Two months free when billed yearly — used for the savings badge. */
export function yearlySavings(plan: Plan): number {
  if (plan.monthlyPrice === 0) return 0
  return plan.monthlyPrice * 12 - plan.yearlyPrice
}
