import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { FormDialog } from '@/components/common/FormDialog'
import { PasswordField } from '@/components/common/PasswordField'
import { TextField } from '@/components/common/TextField'
import { messages } from '@/config/messages'
import { applyFieldErrors } from '@/lib/forms'
import { useCreateValidator } from '../api/validators'

const MIN_PASSWORD_LENGTH = 8

const schema = z.object({
  name: z.string().trim().min(1, 'Ingresá el nombre del validador.'),
  email: z.string().trim().email('El correo no es válido.'),
  temporaryPassword: z
    .string()
    .min(MIN_PASSWORD_LENGTH, `Usá al menos ${MIN_PASSWORD_LENGTH} caracteres.`),
})

type ValidatorForm = z.infer<typeof schema>

const FIELD_MAP = { temporary_password: 'temporaryPassword' } as const

/**
 * Alta de validador. No hay selector de municipalidad a propósito: el backend
 * le asigna la del agente autenticado (US-035).
 */
export function ValidatorFormDialog() {
  const [open, setOpen] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const createValidator = useCreateValidator()

  const form = useForm<ValidatorForm>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', temporaryPassword: '' },
  })

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) {
      form.reset()
      setFormError(null)
    }
  }

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null)
    try {
      await createValidator.mutateAsync(values)
      toast.success(messages.validators.created)
      handleOpenChange(false)
    } catch (error) {
      setFormError(applyFieldErrors(error, form.setError, FIELD_MAP))
    }
  })

  return (
    <FormDialog
      open={open}
      onOpenChange={handleOpenChange}
      trigger={<Button>{messages.validators.create}</Button>}
      title={messages.validators.createTitle}
      error={formError}
      isSubmitting={form.formState.isSubmitting}
      onSubmit={onSubmit}
    >
      <TextField control={form.control} name="name" label={messages.validators.name} />
      <TextField
        control={form.control}
        name="email"
        type="email"
        label={messages.validators.email}
      />
      <PasswordField
        control={form.control}
        name="temporaryPassword"
        autoComplete="new-password"
        label={messages.validators.temporaryPassword}
        description={messages.validators.temporaryPasswordHint}
      />
    </FormDialog>
  )
}
