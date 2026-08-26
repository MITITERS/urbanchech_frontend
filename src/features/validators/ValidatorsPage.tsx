import { useState } from 'react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { QueryState } from '@/components/common/QueryState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { messages } from '@/config/messages'
import { useMunicipalities } from '@/features/platform-admin/api/municipalities'
import { useAuth } from '@/hooks/useAuth'
import { ROLES } from '@/types/auth'
import { useSetValidatorActive, useValidators } from './api/validators'
import { ValidatorFormDialog } from './components/ValidatorFormDialog'
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
 */
export function ValidatorsPage() {
  const { role } = useAuth()
  const isAdmin = role === ROLES.PLATFORM_ADMIN
  const [municipalityFilter, setMunicipalityFilter] = useState(ALL_MUNICIPALITIES)

  // Solo el admin necesita la lista: es el único que elige municipalidad.
  const municipalities = useMunicipalities({ enabled: isAdmin })
  const query = useValidators(
    isAdmin && municipalityFilter !== ALL_MUNICIPALITIES
      ? { municipalityId: Number(municipalityFilter) }
      : {},
  )
  const setActive = useSetValidatorActive()
  const [pendingDeactivation, setPendingDeactivation] = useState<Validator | null>(null)

  const toggle = async (validator: Validator, active: boolean) => {
    await setActive.mutateAsync({ id: validator.id, active })
    toast.success(
      active ? messages.validators.activated : messages.validators.deactivated,
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
          <QueryState
            isPending={query.isPending}
            isError={query.isError}
            error={query.error}
            onRetry={() => void query.refetch()}
            isEmpty={query.data?.length === 0}
            emptyMessage={
              municipalityFilter === ALL_MUNICIPALITIES
                ? messages.validators.empty
                : messages.validators.emptyForMunicipality
            }
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{messages.validators.name}</TableHead>
                  <TableHead>{messages.validators.email}</TableHead>
                  {/* Para el agente es siempre la suya: no aporta una columna. */}
                  {isAdmin && <TableHead>{messages.validators.municipality}</TableHead>}
                  <TableHead className="w-40">{messages.validators.state}</TableHead>
                  <TableHead className="w-32">
                    {messages.validators.validations}
                  </TableHead>
                  <TableHead className="w-32" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.data?.map((validator) => (
                  <TableRow key={validator.id}>
                    <TableCell className="font-medium">{validator.name}</TableCell>
                    <TableCell>{validator.email}</TableCell>
                    {isAdmin && (
                      <TableCell>{validator.municipality?.city ?? '—'}</TableCell>
                    )}
                    <TableCell>
                      <Badge
                        variant={
                          validator.is_active_validator ? 'default' : 'secondary'
                        }
                      >
                        {validator.is_active_validator
                          ? messages.validators.active
                          : messages.validators.inactive}
                      </Badge>
                      {validator.must_change_password && (
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {messages.validators.pendingPassword}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{validator.validation_count}</TableCell>
                    <TableCell>
                      {validator.is_active_validator ? (
                        <Button
                          variant="outline"
                          onClick={() => setPendingDeactivation(validator)}
                        >
                          {messages.validators.deactivate}
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={() => void toggle(validator, true)}
                        >
                          {messages.validators.activate}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </QueryState>
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
