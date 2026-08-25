import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { messages } from '@/config/messages'
import { REPORT_STATUSES, type ReportStatus } from '../types'

/**
 * Status colors come from the `--status-*` design tokens, never from a hex
 * value written in a component.
 */
const STATUS_CLASS: Record<ReportStatus, string> = {
  [REPORT_STATUSES.PENDING_VALIDATION]: 'bg-status-pending/15 text-status-pending',
  [REPORT_STATUSES.REPORTED]: 'bg-status-in-progress/15 text-status-in-progress',
  [REPORT_STATUSES.IN_PROGRESS]: 'bg-status-in-progress/25 text-status-in-progress',
  [REPORT_STATUSES.RESOLVED]: 'bg-status-resolved/15 text-status-resolved',
  [REPORT_STATUSES.CANCELLED]: 'bg-status-rejected/15 text-status-rejected',
  [REPORT_STATUSES.ARCHIVED]: 'bg-muted text-muted-foreground',
}

export function ReportStatusBadge({ status }: { status: ReportStatus }) {
  return (
    <Badge variant="secondary" className={cn('border-0', STATUS_CLASS[status])}>
      {messages.reports.status[status]}
    </Badge>
  )
}
