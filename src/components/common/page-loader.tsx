import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function PageLoader({ label = 'Loading', className }: { label?: string; className?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn('flex min-h-[60vh] w-full items-center justify-center', className)}
    >
      <Loader2 className="text-muted-foreground size-6 animate-spin" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </div>
  )
}
