import { motion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Reveal, Section, SectionHeading } from '@/components/common/section'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/features/auth/auth-context'
import { HeroPreview } from '@/features/marketing/hero-preview'
import { FAQ, FEATURES, STEPS } from '@/features/marketing/landing-data'
import { FREE_PLAN_LIMIT } from '@/lib/plans'

export default function LandingPage() {
  const { user } = useAuth()
  const primaryHref = user ? '/dashboard' : '/signup'
  const primaryLabel = user ? 'Go to dashboard' : 'Start writing free'

  return (
    <>
      {/* ---------------------------------------------------------------- Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="bg-grid pointer-events-none absolute inset-0 opacity-[0.15] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]"
        />

        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <Badge variant="secondary" className="gap-1.5">
              <Sparkles className="size-3.5" aria-hidden="true" />
              Powered by Claude
            </Badge>

            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              The email you have been <span className="text-gradient">putting off</span>, written
              in seconds
            </h1>

            <p className="text-muted-foreground mt-5 max-w-xl text-lg text-pretty">
              Describe what you need to say. Pick a tone and a length. Get a subject line and a
              message that is ready to send — not a template you still have to rewrite.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link to={primaryHref}>
                  {primaryLabel}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/pricing">See pricing</Link>
              </Button>
            </div>

            <p className="text-muted-foreground mt-4 text-sm">
              {FREE_PLAN_LIMIT} free generations · No card required
            </p>
          </motion.div>

          <HeroPreview />
        </div>
      </section>

      {/* ------------------------------------------------------------ Features */}
      <Section id="features" className="bg-muted/30">
        <SectionHeading
          eyebrow="Why it works"
          title="Built for the emails you actually dread"
          description="Not a chat window with a blinking cursor. A form with the three decisions that determine how an email lands."
        />

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, index) => (
            <Reveal key={feature.title} delay={index * 0.06}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="pt-6">
                  <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
                    <feature.icon className="size-5" aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground mt-2 text-sm text-pretty">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* -------------------------------------------------------- How it works */}
      <Section id="how-it-works">
        <SectionHeading
          eyebrow="How it works"
          title="Three steps, about ten seconds"
          description="No prompt engineering, no blank chat box, no wondering what to type."
        />

        <ol className="mt-14 grid gap-8 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <Reveal key={step.title} delay={index * 0.1}>
              <li className="relative">
                <span className="from-primary flex size-11 items-center justify-center rounded-full bg-gradient-to-br to-fuchsia-500 text-lg font-semibold text-white">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                <p className="text-muted-foreground mt-2 text-sm text-pretty">{step.description}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </Section>

      {/* ----------------------------------------------------------------- FAQ */}
      <Section id="faq" className="bg-muted/30">
        <SectionHeading
          eyebrow="FAQ"
          title="Questions people actually ask"
          description="If something is not covered here, the README in the repository goes deeper."
        />

        <div className="mx-auto mt-12 max-w-3xl">
          <Accordion type="single" collapsible className="w-full">
            {FAQ.map((item, index) => (
              <AccordionItem key={item.question} value={`item-${index}`}>
                <AccordionTrigger className="text-left text-base">{item.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm text-pretty">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Section>

      {/* ----------------------------------------------------------------- CTA */}
      <Section>
        <Reveal>
          <div className="from-primary relative overflow-hidden rounded-3xl bg-gradient-to-br to-fuchsia-600 px-6 py-16 text-center text-white sm:px-12">
            <div
              aria-hidden="true"
              className="bg-grid pointer-events-none absolute inset-0 opacity-10"
            />
            <div className="relative mx-auto max-w-2xl">
              <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                Stop rewriting the same email
              </h2>
              <p className="mt-4 text-lg text-white/85 text-pretty">
                Create an account and write your first draft in the next minute.
              </p>
              <Button size="lg" variant="secondary" asChild className="mt-8">
                <Link to={primaryHref}>
                  {primaryLabel}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
        </Reveal>
      </Section>
    </>
  )
}
