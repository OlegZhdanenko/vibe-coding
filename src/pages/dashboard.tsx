import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/features/auth/auth-context'
import { EmailResult } from '@/features/generator/email-result'
import { GeneratorForm } from '@/features/generator/generator-form'
import { HistoryList } from '@/features/generator/history-list'
import { UsageMeter } from '@/features/generator/usage-meter'
import { useEmailHistory } from '@/features/generator/use-email-history'
import { useGeneration } from '@/features/generator/use-generation'
import type { GenerateEmailInput } from '@/lib/generation/types'

export default function DashboardPage() {
  const { profile, user } = useAuth()
  const { status, streamedText, result, error, errorCode, generate, cancel } = useGeneration()
  const history = useEmailHistory()

  // Kept so "Regenerate" can repeat the request without retyping it.
  const [lastInput, setLastInput] = useState<GenerateEmailInput | null>(null)

  // A spent quota is not retryable, so the form is locked until they upgrade.
  const quotaBlocked = errorCode === 'quota_exceeded'

  const run = useCallback(
    async (input: GenerateEmailInput) => {
      setLastInput(input)
      const generated = await generate(input)

      if (generated) {
        toast.success('Draft ready')
        // The row was inserted server-side, so refresh rather than guess.
        history.reload()
      }
    },
    [generate, history],
  )

  const handleSubmit = useCallback(
    (input: GenerateEmailInput) => {
      void run(input)
    },
    [run],
  )

  const handleRegenerate = useCallback(() => {
    if (lastInput) void run(lastInput)
  }, [lastInput, run])

  const greeting = profile?.full_name?.split(' ')[0] ?? user?.email?.split('@')[0]

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {greeting ? `Hi ${greeting}` : 'Dashboard'}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Describe the email you need. Pick a tone and a length. Send it.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">New email</CardTitle>
            </CardHeader>
            <CardContent>
              <GeneratorForm
                onSubmit={handleSubmit}
                onCancel={cancel}
                busy={status === 'streaming'}
                disabled={quotaBlocked}
              />
            </CardContent>
          </Card>

          <UsageMeter profile={profile} />
        </div>

        <div className="space-y-6">
          <EmailResult
            status={status}
            streamedText={streamedText}
            result={result}
            error={error}
            onRegenerate={handleRegenerate}
            canRegenerate={Boolean(lastInput) && !quotaBlocked}
          />
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">Recent drafts</h2>
          {history.items.length > 0 ? (
            <p className="text-muted-foreground text-xs">{history.items.length} saved</p>
          ) : null}
        </div>

        <HistoryList
          items={history.items}
          loading={history.loading}
          error={history.error}
          onRemove={history.remove}
          onReload={history.reload}
        />
      </section>
    </div>
  )
}
