import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, FileText, List, MapPin, Spline, Users } from 'lucide-react'
import { QueryState } from '@/components/common/QueryState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { messages } from '@/config/messages'
import { useReports } from '@/features/reports/api/reports'
import { Pagination } from '@/features/reports/components/Pagination'
import { ReportFilters } from '@/features/reports/components/ReportFilters'
import { ReportsTable } from '@/features/reports/components/ReportsTable'
import { useReportFilters } from '@/features/reports/hooks/useReportFilters'
import { useMunicipality, useMunicipalityReportMarkers } from './api/municipalities'
import { MunicipalityReportsMap } from './components/MunicipalityReportsMap'

const labels = messages.municipalities

/**
 * Reportes de un municipio, vistos por el administrador de la plataforma.
 *
 * Es la misma lectura que tiene el agente de ese municipio, en lista y en mapa
 * —igual que la app móvil—, pero acotada por el municipio de la URL en lugar de
 * por la jurisdicción del usuario.
 */
export function MunicipalityDetailPage() {
  const { id } = useParams<{ id: string }>()
  const municipalityId = Number(id)
  const municipality = useMunicipality(municipalityId)
  // Los mismos filtros que usa el agente en su listado, acotados a este
  // municipio. Viven en la query string, así que una vista filtrada se puede
  // compartir y sobrevive a un refresh.
  const { filters, update, clear, isFiltered, orderings } = useReportFilters()
  const reports = useReports(filters, municipalityId)
  const markers = useMunicipalityReportMarkers(municipalityId)
  const [view, setView] = useState('list')

  return (
    <div className="space-y-6">
      <Button
        asChild
        variant="ghost"
        size="lg"
        className="-ml-2.5 text-muted-foreground"
      >
        <Link to="/municipalidades">
          <ArrowLeft className="size-4" aria-hidden />
          {labels.backToList}
        </Link>
      </Button>

      <QueryState
        isPending={municipality.isPending}
        isError={municipality.isError}
        error={municipality.error}
        onRetry={() => void municipality.refetch()}
      >
        {municipality.data && (
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="space-y-1">
                <h1 className="font-heading text-xl font-semibold text-foreground">
                  {municipality.data.city}, {municipality.data.province}
                </h1>
                <p className="text-sm text-muted-foreground">{labels.detailReports}</p>
              </div>
              {/*
                Las cifras del municipio, en fila y con ícono. Son el contexto
                de todo lo que viene abajo: cuántos reportes hay que mirar y
                sobre qué área.
              */}
              <div className="flex flex-wrap items-center gap-2">
                {municipality.data.boundary?.length ? (
                  <Badge variant="outline" className="h-7 gap-1.5 px-2.5 font-normal">
                    <Spline className="size-3.5 text-muted-foreground" aria-hidden />
                    {labels.boundaryColumn}:{' '}
                    {labels.boundaryPointsShort(municipality.data.boundary.length)}
                  </Badge>
                ) : null}
                <Badge variant="outline" className="h-7 gap-1.5 px-2.5 font-normal">
                  <FileText className="size-3.5 text-muted-foreground" aria-hidden />
                  {labels.reports}: {municipality.data.report_count}
                </Badge>
                <Badge variant="outline" className="h-7 gap-1.5 px-2.5 font-normal">
                  <Users className="size-3.5 text-muted-foreground" aria-hidden />
                  {labels.users}: {municipality.data.user_count}
                </Badge>
              </div>
            </div>

            <Tabs value={view} onValueChange={setView} className="gap-4">
              <TabsList>
                <TabsTrigger value="list">
                  <List className="size-4" aria-hidden />
                  {labels.viewList}
                </TabsTrigger>
                <TabsTrigger value="map">
                  <MapPin className="size-4" aria-hidden />
                  {labels.viewMap}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="list" className="space-y-4">
                <ReportFilters
                  filters={filters}
                  orderings={orderings}
                  isFiltered={isFiltered}
                  onChange={update}
                  onClear={clear}
                />
                <Card>
                  <CardContent>
                    <QueryState
                      isPending={reports.isPending}
                      isError={reports.isError}
                      error={reports.error}
                      onRetry={() => void reports.refetch()}
                      isEmpty={reports.data?.results.length === 0}
                      // Vacío por los filtros y vacío porque el municipio no
                      // recibió nada son cosas distintas, y la salida también:
                      // una se arregla limpiando filtros y la otra no.
                      emptyMessage={
                        isFiltered ? messages.reports.empty : labels.noReports
                      }
                    >
                      <ReportsTable reports={reports.data?.results ?? []} />
                      <Pagination
                        page={filters.page}
                        pageSize={filters.pageSize}
                        total={reports.data?.count ?? 0}
                        hasPrevious={Boolean(reports.data?.previous)}
                        hasNext={Boolean(reports.data?.next)}
                        onPageChange={(page) => update({ page })}
                        onPageSizeChange={(pageSize) => update({ pageSize })}
                      />
                    </QueryState>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="map">
                <Card>
                  <CardContent>
                    <QueryState
                      isPending={markers.isPending}
                      isError={markers.isError}
                      error={markers.error}
                      onRetry={() => void markers.refetch()}
                    >
                      <MunicipalityReportsMap
                        municipality={municipality.data}
                        markers={markers.data ?? []}
                      />
                    </QueryState>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </QueryState>
    </div>
  )
}
