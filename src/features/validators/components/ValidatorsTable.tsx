import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { messages } from '@/config/messages'
import type { Validator } from '../types'

interface ValidatorsTableProps {
  validators: Validator[]
  /** Para el agente la municipalidad es constante: no aporta una columna. */
  showMunicipality: boolean
  /** Etiqueta y acción del botón de la fila: desactivar, o reactivar. */
  actionLabel: string
  /**
   * Marca la pestaña de archivados. Solo ahí la fila se puede bloquear: la
   * municipalidad dada de baja impide reactivar, nunca desactivar.
   */
  isReactivation?: boolean
  onAction: (validator: Validator) => void
}

/**
 * Una cuenta archivada no se puede reactivar mientras su municipalidad esté
 * dada de baja. Solo aplica a esa acción: desactivar nunca queda trabado.
 */
function cannotBeReactivated(validator: Validator): boolean {
  return validator.municipality == null || validator.municipality.is_active === false
}

/**
 * La tabla de validadores, igual en las dos pestañas.
 *
 * Habilitados y archivados muestran lo mismo y se diferencian solo en qué hace
 * el botón de la fila.
 */
export function ValidatorsTable({
  validators,
  showMunicipality,
  actionLabel,
  isReactivation = false,
  onAction,
}: ValidatorsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{messages.validators.name}</TableHead>
          <TableHead>{messages.validators.email}</TableHead>
          {showMunicipality && (
            <TableHead>{messages.validators.municipality}</TableHead>
          )}
          <TableHead className="w-40">{messages.validators.state}</TableHead>
          <TableHead className="w-32">{messages.validators.validations}</TableHead>
          <TableHead className="w-32" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {validators.map((validator) => (
          <TableRow key={validator.id}>
            <TableCell className="font-medium">{validator.name}</TableCell>
            <TableCell>{validator.email}</TableCell>
            {showMunicipality && (
              <TableCell>{validator.municipality?.city ?? '—'}</TableCell>
            )}
            <TableCell>
              <Badge variant={validator.is_active_validator ? 'default' : 'secondary'}>
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
              <Button
                variant="outline"
                // Reactivar a alguien cuya municipalidad está dada de baja
                // dejaría una cuenta operando sobre una jurisdicción cerrada.
                // El backend lo rechaza; acá se evita el intento y se explica.
                disabled={isReactivation && cannotBeReactivated(validator)}
                title={
                  isReactivation && cannotBeReactivated(validator)
                    ? messages.validators.cannotReactivate
                    : undefined
                }
                onClick={() => onAction(validator)}
              >
                {actionLabel}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
