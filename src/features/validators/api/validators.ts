import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import { userKeys } from '@/lib/queryKeys'
import type { Paginated } from '@/types/api'
import type { Validator, ValidatorPayload } from '../types'

const validatorKeys = {
  all: [...userKeys.all, 'validators'] as const,
  list: () => [...userKeys.all, 'validators', 'list'] as const,
}

async function fetchValidators(): Promise<Validator[]> {
  const { data } = await apiClient.get<Paginated<Validator>>(endpoints.validators.list)
  return data.results
}

export function useValidators() {
  return useQuery({ queryKey: validatorKeys.list(), queryFn: fetchValidators })
}

export function useCreateValidator() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: ValidatorPayload) => {
      // No se manda municipalidad: el backend usa la del agente autenticado.
      const { data } = await apiClient.post<Validator>(endpoints.validators.list, {
        name: payload.name,
        email: payload.email,
        temporary_password: payload.temporaryPassword,
      })
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: validatorKeys.all })
    },
  })
}

export function useSetValidatorActive() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, active }: { id: number; active: boolean }) => {
      const url = active
        ? endpoints.validators.activate(id)
        : endpoints.validators.deactivate(id)
      const { data } = await apiClient.post<Validator>(url)
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: validatorKeys.all })
    },
  })
}

export { validatorKeys }
