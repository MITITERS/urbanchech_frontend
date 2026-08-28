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
import { useMunicipalities } from '@/features/platform-admin/api/municipalities'
import { useAuth } from '@/hooks/useAuth'
import { ROLES, type AccountState } from '@/types/auth'
import { useSetValidatorActive, useValidators } from './api/validators'
import { ValidatorFormDialog } from './components/ValidatorFormDialog'
import { ValidatorsTable } from './components/ValidatorsTable'
import type { Validator } from './types'

/** Valor del filtro cuando no hay municipalidad elegida. */
const ALL_MUNICIPALITIES = 'all'

/**
 * US-035 — alta, listado y baja lógica de validadores.
 *
 * La misma pantalla para los dos roles del panel, porque hacen lo mismo; lo
 * único que cambia es el alcance. El agente ve los de su municipalidad y las
 * altas caen ahí sin que pueda elegir. El admin no está acotado a ninguna: ve
 * los de todas, puede filtrar, y elige la municipalidad en cada alta.
 *
 * Dos pestañas sobre la misma tabla: los habilitados y los archivados —las
 * cuentas dadas de baja—. La separación la resuelve el servidor con `?state=`,
 * así que un validador archivado no ocupa el paginado del listado principal.
 * El filtro por municipalidad vale para las dos pestañas: son dos cortes
 * distintos de la misma lista, no dos listas.
 */
export function ValidatorsPage() {
  const { role } = useAuth()
  const isAdmin = role === ROLES.PLATFORM_ADMIN
  const [municipalityFilter, setMunicipalityFilter] = useState(ALL_MUNICIPALITIES)
  const [tab, setTab] = useState<AccountState>('active')

  // Solo el admin necesita la lista: es el único que elige municipalidad.
  const municipalities = useMunicipalities({ enabled: isAdmin })
  const scope =
    isAdmin && municipalityFilter !== ALL_MUNICIPALITIES
      ? { municipalityId: Number(municipalityFilter) }
      : {}
  // Las dos se piden juntas: es lo que pone el número en el rótulo desde el
  // primer render y hace instantáneo el cambio de pestaña.
  const active = useValidators({ ...scope, state: 'active' })
  const archived = useValidators({ ...scope, state: 'inactive' })
  const setActive = useSetValidatorActive()
  const [pendingDeactivation, setPendingDeactivation] = useState<Validator | null>(null)

  const toggle = async (validator: Validator, activate: boolean) => {
    try {
      await setActive.mutateAsync({ id: validator.id, active: activate })
    } catch (error) {
      // El backend rechaza reactivar una cuenta sin municipalidad activa. Sin
      // este catch el rechazo quedaba como promesa sin atrapar, o sea en la
      // consola en vez de en la pantalla.
      toast.error(normalizeError(error).message)
      return
    }
    toast.success(
      activate ? messages.validators.activated : messages.validators.deactivated,
    )
    setPendingDeactivation(null)
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle>{messages.validators.title}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {!isAdmin
                ? messages.validators.description
                : municipalities.data?.length === 0
                  ? messages.validators.noMunicipalities
                  : messages.validators.adminDescription}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Select value={municipalityFilter} onValueChange={setMunicipalityFilter}>
                <SelectTrigger
                  className="w-56"
                  aria-label={messages.validators.filterByMunicipality}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_MUNICIPALITIES}>
                    {messages.validators.allMunicipalities}
                  </SelectItem>
                  {municipalities.data?.map((municipality) => (
                    <SelectItem key={municipality.id} value={String(municipality.id)}>
                      {municipality.city} — {municipality.province}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <ValidatorFormDialog
              municipalities={isAdmin ? (municipalities.data ?? []) : undefined}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={(value) => setTab(value as AccountState)}>
            <TabsList className="mb-4">
              <TabsTrigger value="active">
                {messages.validators.tabActive}
                {active.data && ` (${active.data.length})`}
              </TabsTrigger>
              <TabsTrigger value="inactive">
                {messages.validators.tabArchived}
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
                    ? messages.validators.empty
                    : messages.validators.emptyForMunicipality
                }
              >
                <ValidatorsTable
                  validators={active.data ?? []}
                  showMunicipality={isAdmin}
                  actionLabel={messages.validators.deactivate}
                  onAction={setPendingDeactivation}
                />
              </QueryState>
            </TabsContent>

            <TabsContent value="inactive">
              <p className="mb-3 text-sm text-muted-foreground">
                {messages.validators.archivedHint}
              </p>
              <QueryState
                isPending={archived.isPending}
                isError={archived.isError}
                error={archived.error}
                onRetry={() => void archived.refetch()}
                isEmpty={archived.data?.length === 0}
                emptyMessage={
                  municipalityFilter === ALL_MUNICIPALITIES
                    ? messages.validators.emptyArchived
                    : messages.validators.emptyArchivedForMunicipality
                }
              >
                <ValidatorsTable
                  validators={archived.data ?? []}
                  showMunicipality={isAdmin}
                  actionLabel={messages.validators.activate}
                  isReactivation
                  // Reactivar no le saca nada a nadie: no pide confirmación.
                  onAction={(validator) => void toggle(validator, true)}
                />
              </QueryState>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* La baja pide confirmación explícita y aclara que no es una expulsión. */}
      <ConfirmDialog
        open={pendingDeactivation !== null}
        onOpenChange={(open) => !open && setPendingDeactivation(null)}
        title={messages.validators.deactivateTitle}
        description={messages.validators.deactivateDescription}
        confirmLabel={messages.validators.deactivateConfirm}
        variant="destructive"
        isPending={setActive.isPending}
        onConfirm={() => {
          if (pendingDeactivation) void toggle(pendingDeactivation, false)
        }}
      />
    </>
  )
}
