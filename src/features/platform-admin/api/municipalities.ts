import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import { municipalityKeys } from '@/lib/queryKeys'
import type { Paginated } from '@/types/api'
import type {
  MunicipalityDetail,
  MunicipalityPayload,
  MunicipalityReportMarker,
} from '../types'

/** UI payload -> API body. The API speaks snake_case. */
function toApiBody(payload: Partial<MunicipalityPayload>) {
  return {
    ...(payload.city !== undefined && { city: payload.city }),
    ...(payload.province !== undefined && { province: payload.province }),
    ...(payload.latitude !== undefined && { latitude: payload.latitude }),
    ...(payload.longitude !== undefined && { longitude: payload.longitude }),
    ...(payload.coverageRadiusKm !== undefined && {
      coverage_radius_km: payload.coverageRadiusKm,
    }),
  }
}

async function fetchMunicipalities(): Promise<MunicipalityDetail[]> {
  const { data } = await apiClient.get<Paginated<MunicipalityDetail>>(
    endpoints.municipalities.list,
  )
  return data.results
}

/**
 * `enabled` existe para la pantalla de validadores, que la comparten los dos
 * roles: el agente no elige municipalidad, así que no tiene por qué pedir la
 * lista —y además la API se la respondería con 403.
 */
export function useMunicipalities({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: municipalityKeys.list(),
    queryFn: fetchMunicipalities,
    enabled,
  })
}

export function useMunicipality(id: number) {
  return useQuery({
    queryKey: municipalityKeys.detail(id),
    queryFn: async () => {
      const { data } = await apiClient.get<MunicipalityDetail>(
        endpoints.municipalities.detail(id),
      )
      return data
    },
  })
}

export function useCreateMunicipality() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: MunicipalityPayload) => {
      const { data } = await apiClient.post<MunicipalityDetail>(
        endpoints.municipalities.list,
        toApiBody(payload),
      )
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: municipalityKeys.all })
    },
  })
}

export function useUpdateMunicipality(id: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: Partial<MunicipalityPayload>) => {
      const { data } = await apiClient.patch<MunicipalityDetail>(
        endpoints.municipalities.detail(id),
        toApiBody(payload),
      )
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: municipalityKeys.all })
    },
  })
}

export function useDeleteMunicipality() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      // Baja lógica del lado del servidor: el municipio deja de recibir
      // reportes y de listarse, pero su historia queda.
      await apiClient.delete(endpoints.municipalities.detail(id))
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: municipalityKeys.all })
    },
  })
}

export function useMunicipalityReportMarkers(id: number) {
  return useQuery({
    queryKey: [...municipalityKeys.detail(id), 'markers'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ results: MunicipalityReportMarker[] }>(
        endpoints.municipalities.reportMarkers(id),
      )
      return data.results
    },
  })
}
