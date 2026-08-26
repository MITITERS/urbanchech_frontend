import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FormDialog } from '@/components/common/FormDialog'
import { PasswordField } from '@/components/common/PasswordField'
import { TextField } from '@/components/common/TextField'
import { messages } from '@/config/messages'
import { applyFieldErrors } from '@/lib/forms'
import { useCreateValidator } from '../api/validators'
import type { MunicipalityDetail } from '@/features/platform-admin/types'

const MIN_PASSWORD_LENGTH = 8

const schema = z.object({
  name: z.string().trim().min(1, 'Ingresá el nombre del validador.'),
  email: z.string().trim().email('El correo no es válido.'),
  temporaryPassword: z
    .string()
    .min(MIN_PASSWORD_LENGTH, `Usá al menos ${MIN_PASSWORD_LENGTH} caracteres.`),
  // Vacío para el agente, que no elige: lo valida el refinamiento de abajo,
  // que solo exige el campo cuando el formulario lo muestra.
  municipalityId: z.string(),
})

type ValidatorForm = z.infer<typeof schema>

const FIELD_MAP = {
  temporary_password: 'temporaryPassword',
  municipality_id: 'municipalityId',
} as const

/**
 * Alta de validador, para los dos roles del panel.
 *
 * El agente no elige municipalidad: el backend le asigna la suya (US-035), así
 * que el selector no se dibuja. El admin de la plataforma no tiene jurisdicción
 * propia de la cual derivarla, así que la elige y es obligatoria. Quién es cada
 * uno lo decide `municipalities`: si llega la lista, hay selector.
 */
export function ValidatorFormDialog({
  municipalities,
}: {
  /** Municipalidades entre las que elegir. Sin esto, no hay selector. */
  municipalities?: MunicipalityDetail[]
}) {
  const [open, setOpen] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const createValidator = useCreateValidator()
  const choosesMunicipality = municipalities !== undefined

  const form = useForm<ValidatorForm>({
    resolver: zodResolver(
      choosesMunicipality
        ? schema.refine((values) => values.municipalityId !== '', {
            path: ['municipalityId'],
            message: 'Elegí una municipalidad.',
          })
        : schema,
    ),
    defaultValues: {
      name: '',
      email: '',
      temporaryPassword: '',
      municipalityId: '',
    },
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
      await createValidator.mutateAsync({
        name: values.name,
        email: values.email,
        temporaryPassword: values.temporaryPassword,
        ...(choosesMunicipality
          ? { municipalityId: Number(values.municipalityId) }
          : {}),
      })
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
      trigger={
        <Button disabled={municipalities?.length === 0}>
          {messages.validators.create}
        </Button>
      }
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
      {choosesMunicipality && (
        <Controller
          control={form.control}
          name="municipalityId"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>
                {messages.validators.municipality}
              </FieldLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id={field.name} aria-invalid={fieldState.invalid}>
                  <SelectValue
                    placeholder={messages.validators.municipalityPlaceholder}
                  />
                </SelectTrigger>
                <SelectContent>
                  {municipalities.map((municipality) => (
                    <SelectItem key={municipality.id} value={String(municipality.id)}>
                      {municipality.city} — {municipality.province}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      )}
    </FormDialog>
  )
}
