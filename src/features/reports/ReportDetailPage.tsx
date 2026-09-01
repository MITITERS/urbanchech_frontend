import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Clock, MapPin, ThumbsUp, User } from 'lucide-react'
import { PersonAvatar } from '@/components/common/PersonAvatar'
import { QueryState } from '@/components/common/QueryState'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { messages } from '@/config/messages'
import { AuthorLink } from '@/features/users/components/AuthorLink'
import { useAuth } from '@/hooks/useAuth'
import { ROLES } from '@/types/auth'
import { cn } from '@/lib/utils'
import { formatDateTime } from '@/lib/format'
import { useReportDetail } from './api/reportDetail'
import { ReportCategoryLabel } from './components/ReportCategory'
import { ReportMap } from './components/ReportMap'
import { ReportStatusBadge } from './components/ReportStatusBadge'
import { StatusHistory } from './components/StatusHistory'
import { TransitionActions } from './components/TransitionActions'
import { REPORT_STATUSES } from './types'

/** Rótulo de una sección dentro de la ficha del reporte. */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
      {children}
    </h2>
  )
}

/** Un dato de la cabecera: ícono, y el valor al lado. */
function MetaItem({
  icon,
  children,
  className,
}: {
  icon: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span aria-hidden className="text-muted-foreground/70">
        {icon}
      </span>
      {children}
    </span>
  )
}

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
      <Button
        asChild
        variant="ghost"
        size="lg"
        className="-ml-2.5 text-muted-foreground"
      >
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
          <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <div className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div className="space-y-2">
                    <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
                      <span className="tabular">#{report.number ?? report.id}</span>
                      <span aria-hidden className="text-border">
                        ·
                      </span>
                      <ReportCategoryLabel category={report.category} />
                    </CardTitle>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <MetaItem icon={<Clock className="size-3.5" />}>
                        {formatDateTime(report.created_at)}
                      </MetaItem>
                      <MetaItem icon={<User className="size-3.5" />}>
                        {messages.reportDetail.author}:{' '}
                        <AuthorLink id={report.author.id} name={report.author.name} />
                      </MetaItem>
                      <MetaItem icon={<ThumbsUp className="size-3.5" />}>
                        {messages.reportDetail.likes}: {report.like_count}
                      </MetaItem>
                    </div>
                  </div>
                  <ReportStatusBadge status={report.status} />
                </CardHeader>
                <CardContent className="space-y-5">
                  {report.photo && (
                    <img
                      src={report.photo}
                      alt=""
                      className="max-h-96 w-full rounded-lg object-cover ring-1 ring-border"
                    />
                  )}
                  <div className="space-y-1.5">
                    <SectionLabel>{messages.reportDetail.description}</SectionLabel>
                    <p className="text-sm leading-relaxed whitespace-pre-line">
                      {report.description}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <SectionLabel>{messages.reportDetail.location}</SectionLabel>
                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="size-3.5 shrink-0" aria-hidden />
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
                        <li key={comment.id} className="flex gap-3">
                          <PersonAvatar
                            name={comment.author.name}
                            src={comment.author.avatar}
                            className="mt-0.5"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm">{comment.text}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              <AuthorLink
                                id={comment.author.id}
                                name={comment.author.name}
                              />{' '}
                              · {formatDateTime(comment.created_at)}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* La columna de acciones acompaña el scroll: el historial y los
                botones son lo que se consulta mientras se lee el reporte. */}
            <div className="space-y-6 lg:sticky lg:top-22 lg:self-start">
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
                    <p className="rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground">
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
