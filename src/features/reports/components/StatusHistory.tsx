import { messages } from '@/config/messages'
import { cn } from '@/lib/utils'
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
    <ol>
      {entries.map((entry, index) => {
        const isLast = index === entries.length - 1

        return (
          <li
            key={`${entry.created_at}-${index}`}
            className="relative flex gap-3 pb-5 last:pb-0"
          >
            {/*
              Un punto por movimiento y una línea que los cose. El borde
              izquierdo que había antes se leía como el margen de una cita, no
              como una secuencia: sin marcas por entrada, no se veía dónde
              terminaba un cambio y empezaba el siguiente.
            */}
            <div className="flex flex-col items-center">
              <span
                aria-hidden
                className={cn(
                  'mt-1 size-2 shrink-0 rounded-full ring-4',
                  index === 0
                    ? 'bg-primary ring-primary/15'
                    : 'bg-border ring-transparent',
                )}
              />
              {!isLast && (
                // Baja hasta el punto siguiente: la línea es lo que convierte
                // tres fechas sueltas en una secuencia.
                <span aria-hidden className="mt-1.5 -mb-5 w-px flex-1 bg-border" />
              )}
            </div>

            <div className="min-w-0 flex-1">
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
                <p className="mt-1.5 rounded-md bg-muted/70 px-2.5 py-1.5 text-sm">
                  <span className="text-muted-foreground">
                    {messages.reportDetail.reason}:{' '}
                  </span>
                  {entry.reason}
                </p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
