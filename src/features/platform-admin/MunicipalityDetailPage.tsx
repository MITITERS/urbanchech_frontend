import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, List, MapPin } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import { QueryState } from '@/components/common/QueryState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { messages } from '@/config/messages'
import { municipalityKeys } from '@/lib/queryKeys'
import { ReportsTable } from '@/features/reports/components/ReportsTable'
import type { PanelReportRow } from '@/features/reports/types'
import type { Paginated } from '@/types/api'
import { useMunicipality, useMunicipalityReportMarkers } from './api/municipalities'
import { MunicipalityReportsMap } from './components/MunicipalityReportsMap'

const labels = messages.municipalities

function useMunicipalityReports(id: number) {
  return useQuery({
    queryKey: [...municipalityKeys.detail(id), 'reports'],
    queryFn: async () => {
      const { data } = await apiClient.get<Paginated<PanelReportRow>>(
        endpoints.municipalities.reports(id),
      )
      return data
    },
  })
}

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
  const reports = useMunicipalityReports(municipalityId)
  const markers = useMunicipalityReportMarkers(municipalityId)
  const [view, setView] = useState('list')

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost">
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
          <Card>
            <CardHeader className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <CardTitle>
                  {municipality.data.city}, {municipality.data.province}
                </CardTitle>
                {municipality.data.coverage_radius_km && (
                  <Badge variant="secondary">
                    {labels.radius}: {Number(municipality.data.coverage_radius_km)} km
                  </Badge>
                )}
                <Badge variant="secondary">
                  {labels.reports}: {municipality.data.report_count}
                </Badge>
                <Badge variant="secondary">
                  {labels.users}: {municipality.data.user_count}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{labels.detailReports}</p>
            </CardHeader>
            <CardContent>
              <Tabs value={view} onValueChange={setView}>
                <TabsList className="mb-4">
                  <TabsTrigger value="list">
                    <List className="size-4" aria-hidden />
                    {labels.viewList}
                  </TabsTrigger>
                  <TabsTrigger value="map">
                    <MapPin className="size-4" aria-hidden />
                    {labels.viewMap}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="list">
                  <QueryState
                    isPending={reports.isPending}
                    isError={reports.isError}
                    error={reports.error}
                    onRetry={() => void reports.refetch()}
                    isEmpty={reports.data?.results.length === 0}
                    emptyMessage={labels.noReports}
                  >
                    <ReportsTable reports={reports.data?.results ?? []} />
                  </QueryState>
                </TabsContent>

                <TabsContent value="map">
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
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </QueryState>
    </div>
  )
}
