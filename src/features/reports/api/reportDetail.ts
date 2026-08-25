import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import { reportKeys } from '@/lib/queryKeys'
import type { PanelReportDetail, TransitionOperation } from '../types'

/** Operation name (domain, Spanish) -> API path segment. */
const OPERATION_PATH: Record<TransitionOperation, string> = {
  procesar: 'process',
  resolver: 'resolve',
  cancelar: 'cancel',
  archivar: 'archive',
  reactivar: 'reactivate',
}

export function useReportDetail(id: number) {
  return useQuery({
    queryKey: reportKeys.detail(id),
    queryFn: async () => {
      const { data } = await apiClient.get<PanelReportDetail>(
        endpoints.panelReports.detail(id),
      )
      return data
    },
  })
}

export function useReportTransition(id: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      operation,
      reason,
    }: {
      operation: TransitionOperation
      reason?: string
    }) => {
      const { data } = await apiClient.post<PanelReportDetail>(
        endpoints.panelReports.transition(id, OPERATION_PATH[operation]),
        reason ? { reason } : {},
      )
      return data
    },
    onSuccess: (detail) => {
      queryClient.setQueryData(reportKeys.detail(id), detail)
      // Se invalida por prefijo para que el listado refleje el cambio sin
      // importar qué filtros tenga aplicados el agente.
      void queryClient.invalidateQueries({ queryKey: reportKeys.all })
    },
    onError: () => {
      // Un 409 significa que la vista estaba desactualizada: releerla es la
      // forma de que el agente vea el estado real y las acciones correctas.
      void queryClient.invalidateQueries({ queryKey: reportKeys.detail(id) })
    },
  })
}
