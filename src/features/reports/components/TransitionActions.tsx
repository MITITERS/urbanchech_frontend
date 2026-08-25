import { useState } from 'react'
import { toast } from 'sonner'
import { isApiError } from '@/api/client'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { messages } from '@/config/messages'
import { useReportTransition } from '../api/reportDetail'
import type { AvailableTransition, TransitionOperation } from '../types'

const CONFLICT_STATUS = 409
const DESTRUCTIVE: readonly TransitionOperation[] = ['cancelar', 'archivar']

/**
 * Renders only the transitions the backend says are possible right now. The
 * panel never draws five buttons and disables four: the state machine lives in
 * one place and this reads from it.
 */
export function TransitionActions({
  reportId,
  transitions,
}: {
  reportId: number
  transitions: AvailableTransition[]
}) {
  const transition = useReportTransition(reportId)
  const [pending, setPending] = useState<AvailableTransition | null>(null)
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState<string | null>(null)

  if (transitions.length === 0) return null

  const close = () => {
    setPending(null)
    setReason('')
    setReasonError(null)
  }

  const confirm = async () => {
    if (!pending) return
    if (pending.requires_reason && reason.trim() === '') {
      setReasonError('Indicá el motivo para poder continuar.')
      return
    }
    try {
      await transition.mutateAsync({
        operation: pending.operation,
        reason: pending.requires_reason ? reason.trim() : undefined,
      })
      toast.success(messages.reportDetail.updated)
      close()
    } catch (error) {
      toast.error(
        isApiError(error) && error.status === CONFLICT_STATUS
          ? messages.reportDetail.conflict
          : isApiError(error)
            ? error.message
            : messages.errors.unexpected,
      )
      close()
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {transitions.map((item) => (
          <Button
            key={item.operation}
            variant={DESTRUCTIVE.includes(item.operation) ? 'outline' : 'default'}
            onClick={() => setPending(item)}
          >
            {messages.transitions[item.operation].label}
          </Button>
        ))}
      </div>

      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => !open && close()}
        title={
          pending
            ? messages.reportDetail.confirmTitle(
                messages.transitions[pending.operation].label,
              )
            : ''
        }
        description={pending ? messages.transitions[pending.operation].description : ''}
        confirmLabel={pending ? messages.transitions[pending.operation].label : ''}
        variant={
          pending && DESTRUCTIVE.includes(pending.operation) ? 'destructive' : 'default'
        }
        isPending={transition.isPending}
        onConfirm={() => void confirm()}
      >
        {pending?.requires_reason && (
          <Field data-invalid={reasonError !== null}>
            <FieldLabel htmlFor="transition-reason">
              {messages.reportDetail.reasonLabel}
            </FieldLabel>
            <Input
              id="transition-reason"
              value={reason}
              placeholder={messages.reportDetail.reasonPlaceholder}
              aria-invalid={reasonError !== null}
              onChange={(event) => {
                setReason(event.target.value)
                setReasonError(null)
              }}
            />
            {reasonError && <FieldError errors={[{ message: reasonError }]} />}
          </Field>
        )}
      </ConfirmDialog>
    </>
  )
}
