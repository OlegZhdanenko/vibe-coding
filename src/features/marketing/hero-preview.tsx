import { motion } from 'framer-motion'
import { Check, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

const LINES = [
  'Hi Marta,',
  '',
  'I would like to take Thursday and Friday next week as holiday — I am moving flats and would rather not do it around meetings.',
  '',
  'I will have the Kessler report finished and handed over on Wednesday, so nothing is left waiting on me.',
  '',
  'Let me know if that works.',
]

/**
 * Static product illustration for the hero. It mimics the real result card so
 * the landing page shows the actual output shape rather than a stock photo.
 */
export function HeroPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, rotate: -1 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' }}
      className="relative"
    >
      <div
        aria-hidden="true"
        className="from-primary/25 absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br to-fuchsia-500/20 blur-2xl"
      />

      <Card className="overflow-hidden shadow-xl">
        <div className="bg-muted/60 flex items-center gap-2 border-b px-4 py-3">
          <span className="size-2.5 rounded-full bg-red-400" />
          <span className="size-2.5 rounded-full bg-amber-400" />
          <span className="size-2.5 rounded-full bg-emerald-400" />
          <Badge variant="secondary" className="ml-auto gap-1 text-xs">
            <Sparkles className="size-3" aria-hidden="true" />
            Professional · Medium
          </Badge>
        </div>

        <CardContent className="space-y-4 p-5">
          <div>
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Subject
            </p>
            <p className="mt-1 font-medium">Holiday request: Thursday and Friday next week</p>
          </div>

          <div className="bg-muted/40 space-y-2 rounded-lg border p-4 text-sm leading-relaxed">
            {LINES.map((line, index) =>
              line ? (
                <motion.p
                  key={line}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.5 + index * 0.12 }}
                >
                  {line}
                </motion.p>
              ) : null,
            )}
          </div>

          <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <Check className="size-3.5 text-emerald-600" aria-hidden="true" />
            Written in 4 seconds
          </p>
        </CardContent>
      </Card>
    </motion.div>
  )
}
