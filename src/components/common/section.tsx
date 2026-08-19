import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SectionProps {
  id?: string
  children: ReactNode
  className?: string
  containerClassName?: string
}

export function Section({ id, children, className, containerClassName }: SectionProps) {
  return (
    <section id={id} className={cn('scroll-mt-20 py-16 sm:py-24', className)}>
      <div className={cn('mx-auto w-full max-w-6xl px-4 sm:px-6', containerClassName)}>
        {children}
      </div>
    </section>
  )
}

interface SectionHeadingProps {
  eyebrow?: string
  title: ReactNode
  description?: ReactNode
  align?: 'left' | 'center'
  className?: string
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'center',
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        'max-w-2xl',
        align === 'center' ? 'mx-auto text-center' : 'text-left',
        className,
      )}
    >
      {eyebrow ? (
        <p className="text-primary text-sm font-semibold tracking-wide uppercase">{eyebrow}</p>
      ) : null}
      <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="text-muted-foreground mt-4 text-base text-pretty sm:text-lg">{description}</p>
      ) : null}
    </div>
  )
}

/** Fades content in once as it scrolls into view; respects reduced motion. */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode
  delay?: number
  className?: string
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
