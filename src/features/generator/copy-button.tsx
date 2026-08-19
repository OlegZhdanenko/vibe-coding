import { Check, Copy } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

interface CopyButtonProps {
  value: string
  label?: string
  variant?: 'default' | 'outline' | 'ghost' | 'secondary'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function CopyButton({
  value,
  label = 'Copy',
  variant = 'outline',
  size = 'sm',
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), [])

  const handleCopy = async () => {
    try {
      // Not available on insecure origins or in some embedded webviews.
      if (!navigator.clipboard) throw new Error('Clipboard unavailable')
      await navigator.clipboard.writeText(value)
      setCopied(true)
      timer.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Could not copy. Select the text and copy it manually.')
    }
  }

  return (
    <Button type="button" variant={variant} size={size} onClick={() => void handleCopy()}>
      {copied ? (
        <Check className="size-4 text-emerald-600" aria-hidden="true" />
      ) : (
        <Copy className="size-4" aria-hidden="true" />
      )}
      {size === 'icon' ? <span className="sr-only">{label}</span> : copied ? 'Copied' : label}
    </Button>
  )
}
