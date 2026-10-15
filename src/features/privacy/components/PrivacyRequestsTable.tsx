import { Link } from 'react-router-dom'
import { Clock, ImageOff } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { messages } from '@/config/messages'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { PrivacyDecision } from '../api/privacyRequests'
import { describeRemaining, isOverdue } from '../deadline'
import type { PrivacyRequest } from '../types'

interface PrivacyRequestsTableProps {
  requests: PrivacyRequest[]
  /** `pending` muestra el plazo y las acciones; `resolved`, el registro. */
  variant: 'pending' | 'resolved'
  now: number
  onDecide?: (request: PrivacyRequest, decision: PrivacyDecision) => void
}

/**
 * La bandeja de US-043, en sus dos cortes.
 *
 * Una sola tabla para las dos pestañas, como en agentes: la imagen y el reporte
 * se muestran igual, y lo que cambia es la columna del final. En las pendientes
 * es el tiempo que queda y las dos decisiones; en las resueltas, qué se decidió,
 * quién y si fue dentro del plazo, que es lo que el registro tiene que probar.
 */
export function PrivacyRequestsTable({
  requests,
  variant,
  now,
  onDecide,
}: PrivacyRequestsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-36">{messages.privacy.image}</TableHead>
          <TableHead>{messages.privacy.report}</TableHead>
          <TableHead className="w-40">{messages.privacy.receivedAt}</TableHead>
          {variant === 'pending' ? (
            <>
              <TableHead className="w-48">{messages.privacy.deadline}</TableHead>
              <TableHead className="w-56" />
            </>
          ) : (
            <>
              <TableHead className="w-44">{messages.privacy.decision}</TableHead>
              <TableHead className="w-48">{messages.privacy.resolvedAt}</TableHead>
            </>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.map((request) => (
          <TableRow key={request.id}>
            <TableCell>
              <ImageCell request={request} />
            </TableCell>
            <TableCell className="max-w-sm">
              <ReportCell request={request} />
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {formatDateTime(request.received_at)}
            </TableCell>
            {variant === 'pending' ? (
              <>
                <TableCell>
                  <DeadlineCell deadline={request.deadline} now={now} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => onDecide?.(request, 'dismiss')}
                    >
                      {messages.privacy.dismiss}
                    </Button>
                    <Button
                      className="bg-destructive text-white hover:bg-destructive/90"
                      onClick={() => onDecide?.(request, 'remove-image')}
                    >
                      {messages.privacy.removeImage}
                    </Button>
                  </div>
                </TableCell>
              </>
            ) : (
              <>
                <TableCell>
                  <Badge variant="secondary">
                    {messages.privacy.status[request.status]}
                  </Badge>
                  {request.resolved_by && (
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {messages.privacy.resolvedBy}:{' '}
                      {request.resolved_by.name || request.resolved_by.email}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-sm">
                  <span className="block text-muted-foreground">
                    {formatDateTime(request.resolved_at)}
                  </span>
                  <span
                    className={cn(
                      'text-xs font-medium',
                      request.resolved_within_deadline
                        ? 'text-status-resolved'
                        : 'text-destructive',
                    )}
                  >
                    {request.resolved_within_deadline
                      ? messages.privacy.withinDeadline
                      : messages.privacy.lateResolution}
                  </span>
                </TableCell>
              </>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

const IMAGE_LABEL: Record<PrivacyRequest['image']['kind'], string> = {
  report: messages.privacy.reportPhoto,
  resolution_evidence: messages.privacy.evidencePhoto,
  resolution_appeal: messages.privacy.appealPhoto,
}

function ImageCell({ request }: { request: PrivacyRequest }) {
  const label = IMAGE_LABEL[request.image.kind]
  return (
    <figure className="space-y-1">
      {request.image.url ? (
        // Abre la foto completa en otra pestaña: la miniatura no alcanza para
        // decidir si una cara se reconoce.
        <a href={request.image.url} target="_blank" rel="noreferrer">
          <img
            src={request.image.url}
            alt={label}
            className="h-20 w-32 rounded-md object-cover ring-1 ring-border"
          />
        </a>
      ) : (
        <span className="flex h-20 w-32 flex-col items-center justify-center gap-1 rounded-md bg-muted text-xs text-muted-foreground">
          <ImageOff className="size-4" aria-hidden />
          {messages.privacy.imageGone}
        </span>
      )}
      <figcaption className="text-xs text-muted-foreground">{label}</figcaption>
    </figure>
  )
}

function ReportCell({ request }: { request: PrivacyRequest }) {
  const { report } = request
  return (
    <div className="space-y-0.5">
      <Link
        to={`/reportes/${report.id}`}
        className="font-medium text-primary hover:underline"
      >
        {messages.privacy.reportNumber(report.number ?? report.id)}
      </Link>
      <p className="text-xs text-muted-foreground">
        {report.municipality.city} — {report.municipality.province}
      </p>
      <p className="line-clamp-2 text-sm">{report.description}</p>
    </div>
  )
}

function DeadlineCell({ deadline, now }: { deadline: string; now: number }) {
  const overdue = isOverdue(deadline, now)
  return (
    <div className="space-y-1">
      {overdue && <Badge variant="destructive">{messages.privacy.overdue}</Badge>}
      <p
        className={cn(
          'flex items-center gap-1.5 text-sm',
          overdue ? 'font-medium text-destructive' : 'text-foreground',
        )}
      >
        <Clock className="size-3.5 shrink-0" aria-hidden />
        {describeRemaining(deadline, now)}
      </p>
    </div>
  )
}
