import {
  Clock,
  Globe2,
  History,
  Palette,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'

export interface Feature {
  icon: LucideIcon
  title: string
  description: string
}

export const FEATURES: Feature[] = [
  {
    icon: Clock,
    title: 'From blank page to draft in seconds',
    description:
      'Describe the situation in one sentence. You get a subject line and a finished message you can actually send.',
  },
  {
    icon: Palette,
    title: 'Nine tones that actually differ',
    description:
      'Formal for the client, direct for your teammate, apologetic for the deadline you missed. Each one is prompted separately.',
  },
  {
    icon: Globe2,
    title: 'Six languages',
    description:
      'Write to a German supplier or a Ukrainian colleague without switching tools or second-guessing your phrasing.',
  },
  {
    icon: History,
    title: 'Every draft kept',
    description:
      'Your history is saved to your account, so the email you wrote last month is one click away.',
  },
  {
    icon: Sparkles,
    title: 'Streams as it writes',
    description:
      'You see the message appear line by line, so you can tell within a second whether it is going the right way.',
  },
  {
    icon: ShieldCheck,
    title: 'Your drafts stay yours',
    description:
      'Row-level security means every draft is readable only by the account that created it. Nothing is shared.',
  },
]

export interface Step {
  title: string
  description: string
}

export const STEPS: Step[] = [
  {
    title: 'Describe it',
    description:
      'One or two sentences about what you need to say and why. Rough notes are fine — that is the point.',
  },
  {
    title: 'Pick tone and length',
    description:
      'Choose how it should land and how much room it needs. Short note or detailed brief.',
  },
  {
    title: 'Review and send',
    description:
      'Copy the subject and body, adjust anything you want, and send it from your own inbox.',
  },
]

export interface FaqItem {
  question: string
  answer: string
}

export const FAQ: FaqItem[] = [
  {
    question: 'Which model writes the emails?',
    answer:
      'Google Gemini (gemini-3.6-flash). The call happens on the server, so the API key is never exposed to the browser. The model sits behind a provider interface, so switching to a different one is a single file.',
  },
  {
    question: 'Do I need to pay to try it?',
    answer:
      'No. Every new account gets ten generations on the free plan, with all tones, lengths and languages available. No card is required.',
  },
  {
    question: 'Does it send the email for me?',
    answer:
      'No, and that is deliberate. You copy the draft into your own mail client, which keeps you in control of the final wording and the send button.',
  },
  {
    question: 'Can it write in my own voice?',
    answer:
      'Tone presets get you most of the way. The more context you put in the description — how you normally talk to this person, what you have already agreed — the closer the result lands.',
  },
  {
    question: 'What happens to what I type?',
    answer:
      'Your description and the resulting draft are stored against your account so you can find them later. Row-level security means nobody else can read them, and you can delete any draft from the dashboard.',
  },
  {
    question: 'Is this a finished product?',
    answer:
      'It is a working MVP built as a test assignment. The generation, accounts, quotas and history are all real; the payment step is a mocked flow rather than a live Stripe integration.',
  },
]
