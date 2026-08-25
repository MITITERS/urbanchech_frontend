import type { ReactNode } from 'react'
import { isApiError } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { messages } from '@/config/messages'

interface QueryStateProps {
  isPending: boolean
  isError: boolean
  error?: unknown
  onRetry?: () => void
  /** Rendered instead of the children when the query resolved to nothing. */
  isEmpty?: boolean
  emptyMessage?: string
  children: ReactNode
}

/**
 * Loading, error and empty states for a query-backed view, in one place.
 *
 * Every listing of the panel goes through it so none of them can end up as a
 * blank table: the three states are always resolved explicitly.
 */
export function QueryState({
  isPending,
  isError,
  error,
  onRetry,
  isEmpty = false,
  emptyMessage = messages.common.empty,
  children,
}: QueryStateProps) {
  if (isPending) {
    return (
      <div className="space-y-2" role="status" aria-busy="true">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-2/3" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-md border border-destructive/40 p-4">
        <p role="alert" className="text-sm text-destructive">
          {isApiError(error) ? error.message : messages.common.loadError}
        </p>
        {onRetry && (
          <Button variant="outline" onClick={onRetry}>
            {messages.common.retry}
          </Button>
        )}
      </div>
    )
  }

  if (isEmpty) {
    return (
      <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    )
  }

  return <>{children}</>
}
