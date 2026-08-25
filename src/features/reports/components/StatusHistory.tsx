import { messages } from '@/config/messages'
import { formatDateTime } from '@/lib/format'
import type { StatusHistoryEntry } from '../types'

/** US-013, escenario 7: quién movió el reporte, cuándo, y por qué. */
export function StatusHistory({ entries }: { entries: StatusHistoryEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {messages.reportDetail.historyEmpty}
      </p>
    )
  }

  return (
    <ol className="space-y-4">
      {entries.map((entry, index) => (
        <li
          key={`${entry.created_at}-${index}`}
          className="border-l-2 border-border pl-4"
        >
          <p className="text-sm font-medium">
            {entry.previous_status
              ? `${messages.reports.status[entry.previous_status]} → ${
                  messages.reports.status[entry.status]
                }`
              : messages.reportDetail.initialStatus}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDateTime(entry.created_at)}
            {entry.changed_by ? ` · ${entry.changed_by.name}` : ''}
          </p>
          {entry.reason && (
            <p className="mt-1 text-sm">
              <span className="text-muted-foreground">
                {messages.reportDetail.reason}:{' '}
              </span>
              {entry.reason}
            </p>
          )}
        </li>
      ))}
    </ol>
  )
}
