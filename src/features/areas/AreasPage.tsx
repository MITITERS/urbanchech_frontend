import { useState } from 'react'
import { toast } from 'sonner'
import { normalizeError } from '@/api/client'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { PageHeader } from '@/components/common/PageHeader'
import { QueryState } from '@/components/common/QueryState'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { messages } from '@/config/messages'
import { useMunicipalities } from '@/features/platform-admin/api/municipalities'
import { useAuth } from '@/hooks/useAuth'
import { ROLES, type AccountState } from '@/types/auth'
import { useAreas, useSetAreaActive } from './api/areas'
import { AreaFormDialog } from './components/AreaFormDialog'
import { AreasTable } from './components/AreasTable'
import type { OperationalArea } from './types'

/** Valor del filtro cuando no hay municipalidad elegida. */
const ALL_MUNICIPALITIES = 'all'

/**
 * US-039 — alta, edición, listado y baja lógica de áreas operativas.
 *
 * Mismo patrón que la gestión de validadores de US-035, a propósito: es el
 * mismo tablero y quien ya usó aquella pantalla no tiene nada nuevo que
 * aprender acá. Dos pestañas sobre la misma tabla, y la separación la resuelve
 * el servidor con `?state=`.
 */
export function AreasPage() {
  const { role } = useAuth()
  const isAdmin = role === ROLES.PLATFORM_ADMIN
  const [municipalityFilter, setMunicipalityFilter] = useState(ALL_MUNICIPALITIES)
  const [tab, setTab] = useState<AccountState>('active')

  const municipalities = useMunicipalities({ enabled: isAdmin })
  const scope =
    isAdmin && municipalityFilter !== ALL_MUNICIPALITIES
      ? { municipalityId: Number(municipalityFilter) }
      : {}
  const active = useAreas({ ...scope, state: 'active' })
  const archived = useAreas({ ...scope, state: 'inactive' })
  const setActive = useSetAreaActive()
  const [pendingDeactivation, setPendingDeactivation] =
    useState<OperationalArea | null>(null)

  const toggle = async (area: OperationalArea, activate: boolean) => {
    try {
      await setActive.mutateAsync({ id: area.id, active: activate })
    } catch (error) {
      toast.error(normalizeError(error).message)
      return
    }
    toast.success(activate ? messages.areas.activated : messages.areas.deactivated)
    setPendingDeactivation(null)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={messages.areas.title}
        description={
          isAdmin ? messages.areas.adminDescription : messages.areas.description
        }
        actions={
          <>
            {isAdmin && (
              <Select value={municipalityFilter} onValueChange={setMunicipalityFilter}>
                <SelectTrigger
                  className="w-56"
                  aria-label={messages.areas.filterByMunicipality}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_MUNICIPALITIES}>
                    {messages.areas.allMunicipalities}
                  </SelectItem>
                  {municipalities.data?.map((municipality) => (
                    <SelectItem key={municipality.id} value={String(municipality.id)}>
                      {municipality.city} — {municipality.province}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <AreaFormDialog
              municipalities={isAdmin ? (municipalities.data ?? []) : undefined}
            />
          </>
        }
      />

      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as AccountState)}
        className="gap-4"
      >
        <TabsList>
          <TabsTrigger value="active">
            {messages.areas.tabActive}
            {active.data && ` (${active.data.length})`}
          </TabsTrigger>
          <TabsTrigger value="inactive">
            {messages.areas.tabArchived}
            {archived.data && ` (${archived.data.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <Card>
            <CardContent>
              <QueryState
                isPending={active.isPending}
                isError={active.isError}
                error={active.error}
                onRetry={() => void active.refetch()}
                isEmpty={active.data?.length === 0}
                emptyMessage={
                  municipalityFilter === ALL_MUNICIPALITIES
                    ? messages.areas.empty
                    : messages.areas.emptyForMunicipality
                }
              >
                <AreasTable
                  areas={active.data ?? []}
                  showMunicipality={isAdmin}
                  actionLabel={messages.areas.deactivate}
                  onAction={setPendingDeactivation}
                />
              </QueryState>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inactive">
          <Card>
            <CardContent className="space-y-3">
              <p className="rounded-lg bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
                {messages.areas.archivedHint}
              </p>
              <QueryState
                isPending={archived.isPending}
                isError={archived.isError}
                error={archived.error}
                onRetry={() => void archived.refetch()}
                isEmpty={archived.data?.length === 0}
                emptyMessage={messages.areas.emptyArchived}
              >
                <AreasTable
                  areas={archived.data ?? []}
                  showMunicipality={isAdmin}
                  actionLabel={messages.areas.activate}
                  // Reactivar no le saca nada a nadie: no pide confirmación.
                  onAction={(area) => void toggle(area, true)}
                />
              </QueryState>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* La baja pide confirmación explícita y dice cuántos reportes quedan
          vinculados: es la consecuencia que no se ve desde esta pantalla. */}
      <ConfirmDialog
        open={pendingDeactivation !== null}
        onOpenChange={(open) => !open && setPendingDeactivation(null)}
        title={messages.areas.deactivateTitle}
        description={
          pendingDeactivation
            ? `${messages.areas.deactivateDescription} ${messages.areas.deactivateReports(
                pendingDeactivation.report_count,
              )}`
            : messages.areas.deactivateDescription
        }
        confirmLabel={messages.areas.deactivateConfirm}
        variant="destructive"
        isPending={setActive.isPending}
        onConfirm={() => {
          if (pendingDeactivation) void toggle(pendingDeactivation, false)
        }}
      />
    </div>
  )
}
