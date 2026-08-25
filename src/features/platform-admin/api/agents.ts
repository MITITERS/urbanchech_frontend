import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import { userKeys } from '@/lib/queryKeys'
import type { Paginated } from '@/types/api'
import type { MunicipalAgent, MunicipalAgentPayload } from '../types'

/** Query key for the municipal-agent listing, under the shared users domain. */
const agentKeys = {
  all: [...userKeys.all, 'agents'] as const,
  list: () => [...userKeys.all, 'agents', 'list'] as const,
}

async function fetchAgents(): Promise<MunicipalAgent[]> {
  const { data } = await apiClient.get<Paginated<MunicipalAgent>>(
    endpoints.municipalAgents.list,
  )
  return data.results
}

export function useMunicipalAgents() {
  return useQuery({ queryKey: agentKeys.list(), queryFn: fetchAgents })
}

export function useCreateMunicipalAgent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: MunicipalAgentPayload) => {
      const { data } = await apiClient.post<MunicipalAgent>(
        endpoints.municipalAgents.list,
        {
          name: payload.name,
          email: payload.email,
          temporary_password: payload.temporaryPassword,
          municipality_id: payload.municipalityId,
        },
      )
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: agentKeys.all })
    },
  })
}

export { agentKeys }
