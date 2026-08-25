import { Button } from '@/components/ui/button'
import { messages } from '@/config/messages'

interface PaginationProps {
  page: number
  pageSize: number
  total: number
  hasPrevious: boolean
  hasNext: boolean
  onPageChange: (page: number) => void
}

export function Pagination({
  page,
  pageSize,
  total,
  hasPrevious,
  hasNext,
  onPageChange,
}: PaginationProps) {
  if (total === 0) return null

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <div className="flex items-center justify-between gap-4 pt-4">
      <p className="text-sm text-muted-foreground">
        {messages.reports.pagination.summary(from, to, total)}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          disabled={!hasPrevious}
          onClick={() => onPageChange(page - 1)}
        >
          {messages.reports.pagination.previous}
        </Button>
        <Button
          variant="outline"
          disabled={!hasNext}
          onClick={() => onPageChange(page + 1)}
        >
          {messages.reports.pagination.next}
        </Button>
      </div>
    </div>
  )
}
