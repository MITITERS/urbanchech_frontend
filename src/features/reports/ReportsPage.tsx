import { QueryState } from '@/components/common/QueryState'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { messages } from '@/config/messages'
import { PAGE_SIZE, useReports } from './api/reports'
import { Pagination } from './components/Pagination'
import { ReportFilters } from './components/ReportFilters'
import { ReportsTable } from './components/ReportsTable'
import { useReportFilters } from './hooks/useReportFilters'

/**
 * US-012 — pantalla principal del panel: listado y filtros de reportes.
 *
 * Es del agente municipal, y muestra los de su jurisdicción. El administrador
 * de la plataforma no tiene un listado global: mira los reportes por
 * municipalidad, desde la ficha de cada una.
 */
export function ReportsPage() {
  const { filters, update, clear, isFiltered, orderings } = useReportFilters()
  const query = useReports(filters)

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="space-y-1">
          <CardTitle>{messages.reports.title}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {messages.reports.description}
          </p>
        </div>
        <ReportFilters
          filters={filters}
          orderings={orderings}
          isFiltered={isFiltered}
          onChange={update}
          onClear={clear}
        />
      </CardHeader>
      <CardContent>
        <QueryState
          isPending={query.isPending}
          isError={query.isError}
          error={query.error}
          onRetry={() => void query.refetch()}
          isEmpty={query.data?.results.length === 0}
          emptyMessage={messages.reports.empty}
        >
          <ReportsTable reports={query.data?.results ?? []} />
          <Pagination
            page={filters.page}
            pageSize={PAGE_SIZE}
            total={query.data?.count ?? 0}
            hasPrevious={Boolean(query.data?.previous)}
            hasNext={Boolean(query.data?.next)}
            onPageChange={(page) => update({ page })}
          />
        </QueryState>
      </CardContent>
    </Card>
  )
}
