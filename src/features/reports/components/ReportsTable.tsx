import { Link } from 'react-router-dom'
import {
  EyeOff,
  Flag,
  MapPin,
  MessageSquareDot,
  ScanSearch,
  ThumbsUp,
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { messages } from '@/config/messages'
import { formatDateTime } from '@/lib/format'
import type { PanelReportRow } from '../types'
import { ReportCategoryLabel } from './ReportCategory'
import { ReportStatusBadge } from './ReportStatusBadge'

const columns = messages.reports.columns

export function ReportsTable({ reports }: { reports: PanelReportRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-20">{columns.id}</TableHead>
          <TableHead>{columns.category}</TableHead>
          <TableHead>{columns.status}</TableHead>
          <TableHead>{columns.createdAt}</TableHead>
          <TableHead>{columns.address}</TableHead>
          <TableHead className="w-20 text-right">{columns.likes}</TableHead>
          <TableHead>{columns.operativeArea}</TableHead>
          <TableHead className="w-40">{columns.officialResponse}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reports.map((report) => (
          <TableRow key={report.id} className="group">
            <TableCell>
              {/* Cada fila enlaza al detalle, donde viven las acciones (US-013). */}
              <Link
                to={`/reportes/${report.id}`}
                className="font-semibold text-primary underline-offset-4 group-hover:underline"
              >
                {/* Se lo nombra por su número de municipio; el id va en la
                    URL, que es donde importa que sea único en toda la base. */}
                #{report.number ?? report.id}
              </Link>
            </TableCell>
            <TableCell className="font-medium">
              <ReportCategoryLabel category={report.category} />
            </TableCell>
            <TableCell>
              <span className="flex flex-wrap items-center gap-1.5">
                <ReportStatusBadge status={report.status} />
                {/* US-015, escenario 3: el cierre que la comparación automática
                    marcó como dudoso, para priorizarlo mientras corre la
                    ventana de objeción. Es un indicio, no un veredicto. */}
                {report.needs_closure_review && (
                  <Badge
                    variant="outline"
                    title={messages.reports.closureReviewHint}
                    className="gap-1 border-transparent bg-status-pending/12 text-status-pending ring-1 ring-status-pending/25 ring-inset"
                  >
                    <ScanSearch className="size-3" aria-hidden />
                    {messages.reports.closureReview}
                  </Badge>
                )}
                {/* US-049, escenario 12: denuncias por contenido esperando
                    la decisión del agente. */}
                {report.pending_complaint_count > 0 && (
                  <Badge
                    variant="outline"
                    title={messages.moderation.listFlagHint}
                    className="gap-1 border-transparent bg-destructive/10 text-destructive ring-1 ring-destructive/20 ring-inset"
                  >
                    <Flag className="size-3" aria-hidden />
                    {messages.moderation.listFlag(report.pending_complaint_count)}
                  </Badge>
                )}
                {/* US-042: el vecino todavía no ve este reporte porque su
                    imagen sigue en el difuminado. El panel es el único lugar
                    donde aparece, así que tiene que decir en qué estado está o
                    el agente lo trata como cualquier otro. */}
                {report.photo_status !== 'procesada' && (
                  <Badge
                    variant="outline"
                    title={
                      report.photo_status === 'fallida'
                        ? messages.reports.notPublishedFailedHint
                        : messages.reports.notPublishedHint
                    }
                    className="gap-1 border-transparent bg-muted text-muted-foreground ring-1 ring-border ring-inset"
                  >
                    <EyeOff className="size-3" aria-hidden />
                    {messages.reports.notPublished}
                  </Badge>
                )}
              </span>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatDateTime(report.created_at)}
            </TableCell>
            <TableCell className="max-w-xs">
              <span className="flex items-center gap-1.5">
                <MapPin
                  className="size-3.5 shrink-0 text-muted-foreground"
                  aria-hidden
                />
                <span className="truncate" title={report.address || undefined}>
                  {report.address || '—'}
                </span>
              </span>
            </TableCell>
            <TableCell className="text-right">
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <ThumbsUp className="size-3.5" aria-hidden />
                {report.like_count}
              </span>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {report.operative_area?.name ?? '—'}
            </TableCell>
            <TableCell>
              {/* Escenario 13 de US-024: lo que se busca de un vistazo son los
                  reclamos **sin** comunicación institucional, así que ese es el
                  estado que se marca y el otro queda discreto. */}
              {report.has_official_response ? (
                <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MessageSquareDot className="size-3.5" aria-hidden />
                  {messages.reports.answered}
                </span>
              ) : (
                <Badge variant="secondary">{messages.reports.unanswered}</Badge>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
