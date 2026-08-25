import { describe, expect, it } from 'vitest'
import { normalizeError } from '@/api/client'
import { messages } from '@/config/messages'

/** Minimal stand-in for an axios error; `isAxiosError` is all axios checks. */
function axiosErrorWith(status: number | null, data?: unknown): unknown {
  return {
    isAxiosError: true,
    message: 'request failed',
    config: {},
    response: status === null ? undefined : { status, data },
  }
}

describe('normalizeError', () => {
  it('keeps DRF field errors keyed by field', () => {
    const error = normalizeError(
      axiosErrorWith(400, { email: ['Este campo es obligatorio.'] }),
    )

    expect(error.status).toBe(400)
    expect(error.fieldErrors).toEqual({ email: ['Este campo es obligatorio.'] })
    expect(error.message).toBe('Este campo es obligatorio.')
  })

  it('uses the DRF detail as the message', () => {
    const error = normalizeError(axiosErrorWith(403, { detail: 'Sin permiso.' }))

    expect(error.message).toBe('Sin permiso.')
    expect(error.fieldErrors).toEqual({})
  })

  it('flattens the allauth error envelope', () => {
    const error = normalizeError(
      axiosErrorWith(400, {
        status: 400,
        errors: [{ message: 'Contraseña incorrecta.', param: 'password' }],
      }),
    )

    expect(error.fieldErrors).toEqual({ password: ['Contraseña incorrecta.'] })
    expect(error.message).toBe('Contraseña incorrecta.')
  })

  it('reports a network failure with status 0', () => {
    const error = normalizeError(axiosErrorWith(null))

    expect(error).toEqual({
      status: 0,
      message: messages.errors.network,
      fieldErrors: {},
    })
  })

  it('passes an already normalized error through untouched', () => {
    const original = { status: 404, message: 'No existe.', fieldErrors: {} }

    expect(normalizeError(original)).toBe(original)
  })
})
