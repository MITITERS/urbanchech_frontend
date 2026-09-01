import { Link } from 'react-router-dom'
import { MapPin, ThumbsUp } from 'lucide-react'
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
              <ReportStatusBadge status={report.status} />
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
              {report.operative_area ?? '—'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
