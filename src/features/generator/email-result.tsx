import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, Mail, RotateCcw, Wand2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CopyButton } from '@/features/generator/copy-button'
import type { GenerationStatus } from '@/features/generator/use-generation'
import type { GenerationResult } from '@/lib/generation/client'

interface EmailResultProps {
  status: GenerationStatus
  streamedText: string
  result: GenerationResult | null
  error: string | null
  onRegenerate: () => void
  canRegenerate: boolean
}

export function EmailResult({
  status,
  streamedText,
  result,
  error,
  onRegenerate,
  canRegenerate,
}: EmailResultProps) {
  if (status === 'error') {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="size-4" aria-hidden="true" />
        <AlertTitle>Generation failed</AlertTitle>
        <AlertDescription className="flex flex-col items-start gap-3">
          <span>{error}</span>
          {canRegenerate ? (
            <Button variant="outline" size="sm" onClick={onRegenerate}>
              <RotateCcw className="size-4" aria-hidden="true" />
              Try again
            </Button>
          ) : null}
        </AlertDescription>
      </Alert>
    )
  }

  if (status === 'streaming') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Wand2 className="text-primary size-4 animate-pulse" aria-hidden="true" />
            Writing your email…
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p
            aria-live="polite"
            className="text-sm leading-relaxed whitespace-pre-wrap"
          >
            {streamedText}
            <span className="bg-primary ml-0.5 inline-block h-4 w-0.5 animate-pulse align-middle" />
          </p>
        </CardContent>
      </Card>
    )
  }

  if (status === 'done' && result) {
    const fullText = `Subject: ${result.email.subject}\n\n${result.email.body}`

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={result.email.subject + result.email.body.length}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <Card>
            <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Subject
                </p>
                <CardTitle className="mt-1 text-lg leading-snug text-pretty">
                  {result.email.subject}
                </CardTitle>
              </div>
              <div className="flex shrink-0 gap-2">
                <CopyButton value={result.email.subject} label="Subject" />
                <CopyButton value={fullText} label="Copy all" variant="default" />
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="bg-muted/40 rounded-lg border p-4">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{result.email.body}</p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-muted-foreground text-xs">
                  Written by <span className="font-medium">{result.model}</span>
                </p>
                <div className="flex gap-2">
                  <CopyButton value={result.email.body} label="Copy body" />
                  <Button variant="outline" size="sm" onClick={onRegenerate}>
                    <RotateCcw className="size-4" aria-hidden="true" />
                    Regenerate
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    )
  }

  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center px-6 py-14 text-center">
        <div className="bg-muted text-muted-foreground mb-4 flex size-12 items-center justify-center rounded-full">
          <Mail className="size-6" aria-hidden="true" />
        </div>
        <p className="font-medium">Your draft will appear here</p>
        <p className="text-muted-foreground mt-1 max-w-xs text-sm text-pretty">
          {/* Layout-agnostic wording: the form sits alongside on desktop but
              above on phones, so "on the left" is wrong half the time. */}
          Describe the email you need, pick a tone and a length, then hit Generate.
        </p>
      </CardContent>
    </Card>
  )
}
