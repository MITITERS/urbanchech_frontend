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
import { messages } from '@/config/messages'
import { useSetValidatorActive, useValidators } from './api/validators'
import { ValidatorFormDialog } from './components/ValidatorFormDialog'
import type { Validator } from './types'

/** US-035 — alta, listado y baja lógica de validadores. */
export function ValidatorsPage() {
  const query = useValidators()
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
              {messages.validators.description}
            </p>
          </div>
          <ValidatorFormDialog />
        </CardHeader>
        <CardContent>
          <QueryState
            isPending={query.isPending}
            isError={query.isError}
            error={query.error}
            onRetry={() => void query.refetch()}
            isEmpty={query.data?.length === 0}
            emptyMessage={messages.validators.empty}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{messages.validators.name}</TableHead>
                  <TableHead>{messages.validators.email}</TableHead>
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
