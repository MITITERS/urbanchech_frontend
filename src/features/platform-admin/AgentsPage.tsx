import { useState } from 'react'
import { toast } from 'sonner'
import { normalizeError } from '@/api/client'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { QueryState } from '@/components/common/QueryState'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { messages } from '@/config/messages'
import type { AccountState } from '@/types/auth'
import { useMunicipalAgents, useSetAgentActive } from './api/agents'
import { useMunicipalities } from './api/municipalities'
import { AgentFormDialog } from './components/AgentFormDialog'
import { AgentsTable } from './components/AgentsTable'
import type { MunicipalAgent } from './types'

/**
 * US-017 — alta, listado y archivado de agentes municipales.
 *
 * Dos pestañas sobre la misma tabla: los habilitados, que es el trabajo de
 * todos los días, y los archivados, que son las cuentas dadas de baja. La
 * separación la resuelve el servidor con `?state=`: una cuenta archivada no
 * viaja siquiera en la respuesta del listado principal, así que no le ocupa el
 * paginado a las que sí trabajan.
 *
 * Las dos consultas se piden juntas y no solo la de la pestaña visible: es lo
 * que hace que el número del rótulo esté desde el primer render y que cambiar
 * de pestaña sea instantáneo. Son dos listas chicas.
 *
 * El filtro por municipalidad vale para las dos pestañas —son dos cortes de la
 * misma lista, no dos listas—, igual que en la pantalla de validadores.
 */
/** Valor del filtro cuando no hay municipalidad elegida. */
const ALL_MUNICIPALITIES = 'all'

export function AgentsPage() {
  const [tab, setTab] = useState<AccountState>('active')
  const [municipalityFilter, setMunicipalityFilter] = useState(ALL_MUNICIPALITIES)
  const scope =
    municipalityFilter === ALL_MUNICIPALITIES
      ? {}
      : { municipalityId: Number(municipalityFilter) }
  const active = useMunicipalAgents({ ...scope, state: 'active' })
  const archived = useMunicipalAgents({ ...scope, state: 'inactive' })
  const municipalities = useMunicipalities()
  const setActive = useSetAgentActive()
  const [pendingDeactivation, setPendingDeactivation] = useState<MunicipalAgent | null>(
    null,
  )

  const toggle = async (agent: MunicipalAgent, activate: boolean) => {
    try {
      await setActive.mutateAsync({ id: agent.id, active: activate })
    } catch (error) {
      // El backend rechaza reactivar una cuenta sin municipalidad activa. Sin
      // este catch el rechazo quedaba como promesa sin atrapar, o sea en la
      // consola en vez de en la pantalla.
      toast.error(normalizeError(error).message)
      return
    }
    toast.success(activate ? messages.agents.activated : messages.agents.deactivated)
    setPendingDeactivation(null)
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle>{messages.agents.title}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {municipalities.data?.length === 0
                ? messages.agents.noMunicipalities
                : messages.agents.description}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={municipalityFilter} onValueChange={setMunicipalityFilter}>
              <SelectTrigger
                className="w-56"
                aria-label={messages.agents.filterByMunicipality}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_MUNICIPALITIES}>
                  {messages.agents.allMunicipalities}
                </SelectItem>
                {municipalities.data?.map((municipality) => (
                  <SelectItem key={municipality.id} value={String(municipality.id)}>
                    {municipality.city} — {municipality.province}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <AgentFormDialog municipalities={municipalities.data ?? []} />
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={(value) => setTab(value as AccountState)}>
            <TabsList className="mb-4">
              <TabsTrigger value="active">
                {messages.agents.tabActive}
                {active.data && ` (${active.data.length})`}
              </TabsTrigger>
              <TabsTrigger value="inactive">
                {messages.agents.tabArchived}
                {archived.data && ` (${archived.data.length})`}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active">
              <QueryState
                isPending={active.isPending}
                isError={active.isError}
                error={active.error}
                onRetry={() => void active.refetch()}
                isEmpty={active.data?.length === 0}
                emptyMessage={
                  municipalityFilter === ALL_MUNICIPALITIES
                    ? messages.agents.empty
                    : messages.agents.emptyForMunicipality
                }
              >
                <AgentsTable
                  agents={active.data ?? []}
                  actionLabel={messages.agents.deactivate}
                  onAction={setPendingDeactivation}
                />
              </QueryState>
            </TabsContent>

            <TabsContent value="inactive">
              <p className="mb-3 text-sm text-muted-foreground">
                {messages.agents.archivedHint}
              </p>
              <QueryState
                isPending={archived.isPending}
                isError={archived.isError}
                error={archived.error}
                onRetry={() => void archived.refetch()}
                isEmpty={archived.data?.length === 0}
                emptyMessage={
                  municipalityFilter === ALL_MUNICIPALITIES
                    ? messages.agents.emptyArchived
                    : messages.agents.emptyArchivedForMunicipality
                }
              >
                <AgentsTable
                  agents={archived.data ?? []}
                  actionLabel={messages.agents.activate}
                  isReactivation
                  // Reactivar no le saca nada a nadie: no pide confirmación.
                  onAction={(agent) => void toggle(agent, true)}
                />
              </QueryState>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* La baja pide confirmación explícita y aclara que no borra la cuenta. */}
      <ConfirmDialog
        open={pendingDeactivation !== null}
        onOpenChange={(open) => !open && setPendingDeactivation(null)}
        title={messages.agents.deactivateTitle}
        description={messages.agents.deactivateDescription}
        confirmLabel={messages.agents.deactivateConfirm}
        variant="destructive"
        isPending={setActive.isPending}
        onConfirm={() => {
          if (pendingDeactivation) void toggle(pendingDeactivation, false)
        }}
      />
    </>
  )
}
