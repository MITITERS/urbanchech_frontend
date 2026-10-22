import type { ReactNode } from 'react'
import { CalendarRange } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { QueryState } from '@/components/common/QueryState'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { messages } from '@/config/messages'
import { formatDateOnly } from '@/lib/format'
import { useStatistics } from './api/statistics'
import { CategoryDonut } from './components/CategoryDonut'
import { IndicatorCards } from './components/IndicatorCards'
import { PeriodSelector } from './components/PeriodSelector'
import { StatusBreakdown } from './components/StatusBreakdown'
import { useStatisticsPeriod } from './hooks/useStatisticsPeriod'

const t = messages.statistics

/**
 * La sección de estadísticas (US-023 y US-050), compartida por el agente y por
 * el admin desde la ficha de una municipalidad: la misma vista y los mismos
 * filtros (US-023, escenario 9). Lo único que cambia es a qué endpoint se le
 * pregunta y el título.
 *
 * El selector va en la cabecera y gobierna toda la pantalla —los indicadores y
 * los gráficos—, y la ventana aplicada se ve siempre debajo del título: ningún
 * número se muestra sin decir a qué período corresponde.
 */
export function StatisticsView({
  title,
  description,
  municipalityId,
}: {
  title: string
  description?: ReactNode
  municipalityId?: number
}) {
  const { selection, apply } = useStatisticsPeriod()
  const statistics = useStatistics(selection, municipalityId)
  const data = statistics.data

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={
          <>
            {description}
            {data && (
              <span
                role="status"
                className="mt-2 flex items-center gap-1.5 text-foreground/80"
              >
                <CalendarRange className="size-4 text-muted-foreground" aria-hidden />
                {t.activeWindow(
                  formatDateOnly(data.period.start),
                  formatDateOnly(data.period.end),
                )}
                <span className="text-muted-foreground">· {t.total(data.total)}</span>
              </span>
            )}
          </>
        }
        actions={
          // La clave reinicia el formulario si la URL cambia por fuera.
          <PeriodSelector
            key={`${selection.period}-${selection.start ?? ''}-${selection.end ?? ''}`}
            selection={selection}
            onApply={apply}
          />
        }
      />

      <QueryState
        isPending={statistics.isPending}
        isError={statistics.isError}
        error={statistics.error}
        onRetry={() => void statistics.refetch()}
      >
        {/* Los indicadores van primero y aunque el período no tenga reportes
            creados: puede haber cierres o validaciones de reportes más viejos,
            y lo abierto ahora no depende del período (US-050). */}
        {data && <IndicatorCards indicators={data.indicators} />}
      </QueryState>

      {/* Los gráficos: la carga y el error ya los resolvió el bloque de
          arriba; acá solo falta el vacío propio de las distribuciones. */}
      <QueryState
        isPending={false}
        isError={false}
        isEmpty={data?.total === 0}
        emptyMessage={t.empty}
      >
        {data && (
          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t.byCategory}
                </CardTitle>
              </CardHeader>
              {/* Comparte fila con «Por estado», que es más alta: el contenido
                  se centra en el alto que queda en lugar de dejar un hueco
                  abajo. */}
              <CardContent className="flex flex-1 items-center">
                <CategoryDonut rows={data.by_category} total={data.total} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t.byStatus}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <StatusBreakdown rows={data.by_status} />
              </CardContent>
            </Card>
          </div>
        )}
      </QueryState>
    </div>
  )
}
