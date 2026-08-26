import { Link } from 'react-router-dom'
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
import { ReportStatusBadge } from './ReportStatusBadge'

const columns = messages.reports.columns

export function ReportsTable({ reports }: { reports: PanelReportRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">{columns.id}</TableHead>
          <TableHead>{columns.category}</TableHead>
          <TableHead>{columns.status}</TableHead>
          <TableHead>{columns.createdAt}</TableHead>
          <TableHead>{columns.address}</TableHead>
          <TableHead className="w-20">{columns.likes}</TableHead>
          <TableHead>{columns.operativeArea}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reports.map((report) => (
          <TableRow key={report.id}>
            <TableCell>
              {/* Cada fila enlaza al detalle, donde viven las acciones (US-013). */}
              <Link
                to={`/reportes/${report.id}`}
                className="font-medium text-primary hover:underline"
              >
                {/* Se lo nombra por su número de municipio; el id va en la
                    URL, que es donde importa que sea único en toda la base. */}
                #{report.number ?? report.id}
              </Link>
            </TableCell>
            <TableCell>{messages.reports.category[report.category]}</TableCell>
            <TableCell>
              <ReportStatusBadge status={report.status} />
            </TableCell>
            <TableCell>{formatDateTime(report.created_at)}</TableCell>
            <TableCell className="max-w-xs truncate">{report.address || '—'}</TableCell>
            <TableCell>{report.like_count}</TableCell>
            <TableCell>{report.operative_area ?? '—'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
