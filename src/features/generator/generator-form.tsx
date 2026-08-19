import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Sparkles, Square } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { generateEmailSchema, type GenerateEmailFormValues } from '@/lib/generation/schema'
import {
  LANGUAGES,
  LENGTHS,
  MAX_TOPIC_LENGTH,
  TONES,
  type GenerateEmailInput,
} from '@/lib/generation/types'

interface GeneratorFormProps {
  onSubmit: (input: GenerateEmailInput) => void
  onCancel: () => void
  busy: boolean
  disabled?: boolean
}

const DEFAULTS: GenerateEmailFormValues = {
  topic: '',
  tone: 'professional',
  length: 'medium',
  language: 'English',
  recipient: '',
}

export function GeneratorForm({ onSubmit, onCancel, busy, disabled = false }: GeneratorFormProps) {
  const form = useForm<GenerateEmailFormValues>({
    resolver: zodResolver(generateEmailSchema),
    defaultValues: DEFAULTS,
    mode: 'onSubmit',
  })

  const topic = form.watch('topic')

  const handleSubmit = form.handleSubmit((values) => {
    onSubmit({
      topic: values.topic,
      tone: values.tone,
      length: values.length,
      language: values.language,
      recipient: values.recipient?.trim() || undefined,
    })
  })

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <FormField
          control={form.control}
          name="topic"
          render={({ field }) => (
            <FormItem>
              <FormLabel>What is the email about?</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  rows={5}
                  disabled={disabled}
                  placeholder="Ask my manager for two days off next week to move apartments, and offer to hand over the Kessler report first."
                  className="resize-y"
                />
              </FormControl>
              <div className="flex items-center justify-between gap-3">
                <FormDescription>
                  The more context you give, the less you will have to edit.
                </FormDescription>
                <span
                  className={
                    topic.length > MAX_TOPIC_LENGTH
                      ? 'text-destructive text-xs tabular-nums'
                      : 'text-muted-foreground text-xs tabular-nums'
                  }
                >
                  {topic.length}/{MAX_TOPIC_LENGTH}
                </span>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="tone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tone</FormLabel>
                <Select value={field.value} onValueChange={field.onChange} disabled={disabled}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a tone" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TONES.map((tone) => (
                      <SelectItem key={tone.id} value={tone.id}>
                        <span className="flex flex-col items-start">
                          <span>{tone.label}</span>
                          <span className="text-muted-foreground text-xs">{tone.hint}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="length"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Length</FormLabel>
                <Select value={field.value} onValueChange={field.onChange} disabled={disabled}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a length" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {LENGTHS.map((length) => (
                      <SelectItem key={length.id} value={length.id}>
                        <span className="flex flex-col items-start">
                          <span>{length.label}</span>
                          <span className="text-muted-foreground text-xs">{length.words}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="language"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Language</FormLabel>
                <Select value={field.value} onValueChange={field.onChange} disabled={disabled}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a language" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {LANGUAGES.map((language) => (
                      <SelectItem key={language} value={language}>
                        {language}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="recipient"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Recipient <span className="text-muted-foreground font-normal">(optional)</span>
                </FormLabel>
                <FormControl>
                  <Input {...field} placeholder="my manager, a new client…" disabled={disabled} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="submit" size="lg" className="flex-1" disabled={busy || disabled}>
            {busy ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles className="size-4" aria-hidden="true" />
            )}
            {busy ? 'Writing your email…' : 'Generate email'}
          </Button>

          {busy ? (
            <Button type="button" variant="outline" size="lg" onClick={onCancel}>
              <Square className="size-4" aria-hidden="true" />
              Stop
            </Button>
          ) : null}
        </div>
      </form>
    </Form>
  )
}
