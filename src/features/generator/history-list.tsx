import { Clock, Inbox, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { CopyButton } from '@/features/generator/copy-button'
import { toUserMessage } from '@/lib/errors'
import type { EmailRow } from '@/types/database'

interface HistoryListProps {
  items: EmailRow[]
  loading: boolean
  error: string | null
  onRemove: (id: string) => Promise<void>
  onReload: () => void
}

export function HistoryList({ items, loading, error, onRemove, onReload }: HistoryListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((index) => (
          <Skeleton key={index} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
          <p className="text-muted-foreground text-sm">{error}</p>
          <Button variant="outline" size="sm" onClick={onReload}>
            Try again
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (items.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center py-10 text-center">
          <Inbox className="text-muted-foreground mb-3 size-6" aria-hidden="true" />
          <p className="text-sm font-medium">No drafts yet</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Everything you generate is saved here.
          </p>
        </CardContent>
      </Card>
    )
  }

  const handleRemove = async (id: string) => {
    try {
      await onRemove(id)
      toast.success('Draft deleted')
    } catch (caught) {
      toast.error(toUserMessage(caught))
    }
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.id}>
          <Card className="transition-shadow hover:shadow-sm">
            <CardContent className="space-y-3 py-4">
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 flex-1 font-medium text-pretty">{item.subject}</p>
                <div className="flex shrink-0 gap-1">
                  <CopyButton
                    value={`Subject: ${item.subject}\n\n${item.body}`}
                    label="Copy draft"
                    variant="ghost"
                    size="icon"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete draft"
                    onClick={() => void handleRemove(item.id)}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>

              <p className="text-muted-foreground line-clamp-2 text-sm text-pretty">{item.body}</p>

              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="capitalize">
                  {item.tone}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {item.length}
                </Badge>
                <span className="text-muted-foreground flex items-center gap-1 text-xs">
                  <Clock className="size-3" aria-hidden="true" />
                  {formatDate(item.created_at)}
                </span>
              </div>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  )
}

function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}
