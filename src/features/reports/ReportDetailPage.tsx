import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { QueryState } from '@/components/common/QueryState'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { messages } from '@/config/messages'
import { useAuth } from '@/hooks/useAuth'
import { ROLES } from '@/types/auth'
import { formatDateTime } from '@/lib/format'
import { useReportDetail } from './api/reportDetail'
import { ReportMap } from './components/ReportMap'
import { ReportStatusBadge } from './components/ReportStatusBadge'
import { StatusHistory } from './components/StatusHistory'
import { TransitionActions } from './components/TransitionActions'
import { REPORT_STATUSES } from './types'

/** US-013 — detalle del reporte con las acciones de estado disponibles. */
export function ReportDetailPage() {
  const { id } = useParams<{ id: string }>()
  const reportId = Number(id)
  const query = useReportDetail(reportId)
  const report = query.data
  const { role } = useAuth()
  // Los dos roles llegan a esta pantalla desde lugares distintos, así que el
  // «volver» no puede ser fijo: el agente viene del listado, que es suyo; el
  // admin viene de la ficha de una municipalidad, y el listado le da
  // «permisos insuficientes».
  const back =
    role === ROLES.PLATFORM_ADMIN
      ? {
          to: report?.municipality
            ? `/municipalidades/${report.municipality.id}`
            : '/municipalidades',
          label: messages.reportDetail.backToMunicipality,
        }
      : { to: '/reportes', label: messages.reportDetail.backToList }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost">
        <Link to={back.to}>
          <ArrowLeft className="size-4" aria-hidden />
          {back.label}
        </Link>
      </Button>

      <QueryState
        isPending={query.isPending}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
      >
        {report && (
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div className="space-y-2">
                    <CardTitle>
                      #{report.number ?? report.id} ·{' '}
                      {messages.reports.category[report.category]}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(report.created_at)} ·{' '}
                      {messages.reportDetail.author}: {report.author.name} ·{' '}
                      {messages.reportDetail.likes}: {report.like_count}
                    </p>
                  </div>
                  <ReportStatusBadge status={report.status} />
                </CardHeader>
                <CardContent className="space-y-4">
                  {report.photo && (
                    <img
                      src={report.photo}
                      alt=""
                      className="max-h-96 w-full rounded-md object-cover"
                    />
                  )}
                  <div>
                    <h2 className="text-sm font-medium">
                      {messages.reportDetail.description}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {report.description}
                    </p>
                  </div>
                  <div>
                    <h2 className="text-sm font-medium">
                      {messages.reportDetail.location}
                    </h2>
                    <p className="mb-2 mt-1 text-sm text-muted-foreground">
                      {report.address || '—'}
                    </p>
                    <ReportMap
                      latitude={report.latitude}
                      longitude={report.longitude}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{messages.reportDetail.comments}</CardTitle>
                </CardHeader>
                <CardContent>
                  {report.comments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {messages.reportDetail.noComments}
                    </p>
                  ) : (
                    <ul className="space-y-4">
                      {report.comments.map((comment) => (
                        <li key={comment.id}>
                          <p className="text-sm">{comment.text}</p>
                          <p className="text-xs text-muted-foreground">
                            {comment.author.name} · {formatDateTime(comment.created_at)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{messages.reportDetail.actions}</CardTitle>
                </CardHeader>
                <CardContent>
                  {report.available_transitions.length > 0 ? (
                    <TransitionActions
                      reportId={report.id}
                      transitions={report.available_transitions}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {report.status === REPORT_STATUSES.PENDING_VALIDATION
                        ? messages.reportDetail.awaitingValidation
                        : messages.reportDetail.finalStatus}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{messages.reportDetail.history}</CardTitle>
                </CardHeader>
                <CardContent>
                  <StatusHistory entries={report.status_history} />
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </QueryState>
    </div>
  )
}
