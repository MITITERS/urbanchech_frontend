import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as authApi from '@/api/auth'
import { apiClient } from '@/api/client'
import { messages } from '@/config/messages'
import { AppRoutes } from '@/routes'
import { renderWithProviders } from '@/test/renderWithProviders'
import { ROLES, type AuthUser, type Role } from '@/types/auth'

function buildUser(role: Role): AuthUser {
  return {
    id: 1,
    email: 'usuario@urbancheck.test',
    name: 'Usuario',
    role,
    municipality:
      role === ROLES.MUNICIPAL_AGENT
        ? { id: 1, city: 'Villa María', province: 'Córdoba' }
        : null,
    mustChangePassword: false,
  }
}

beforeEach(() => {
  vi.spyOn(apiClient, 'get').mockResolvedValue({
    data: { count: 0, next: null, previous: null, results: [] },
  })
})

/** Simula el login completo desde la pantalla, con el destino guardado. */
async function loginAs(role: Role, route: string) {
  vi.spyOn(authApi, 'login').mockResolvedValue('token')
  vi.spyOn(authApi, 'fetchCurrentUser').mockResolvedValue(buildUser(role))

  renderWithProviders(<AppRoutes />, { route })

  const user = userEvent.setup()
  await user.type(
    await screen.findByLabelText(messages.auth.email),
    'usuario@urbancheck.test',
  )
  await user.type(screen.getByLabelText(messages.auth.password), 'secreta123')
  await user.click(screen.getByRole('button', { name: messages.auth.submit }))
}

describe('destino después del login', () => {
  it('un agente que venía de una ruta de administrador aterriza en la suya', async () => {
    // El navegador quedó en /municipalidades de una sesión de administrador.
    await loginAs(ROLES.MUNICIPAL_AGENT, '/municipalidades')

    expect(
      await screen.findByRole('link', { name: messages.nav.reports }),
    ).toBeInTheDocument()
    expect(screen.queryByText(messages.forbidden.title)).not.toBeInTheDocument()
  })

  it('un administrador que venía de una ruta de agente aterriza en la suya', async () => {
    await loginAs(ROLES.PLATFORM_ADMIN, '/validadores')

    expect(
      await screen.findByRole('link', { name: messages.nav.municipalities }),
    ).toBeInTheDocument()
    expect(screen.queryByText(messages.forbidden.title)).not.toBeInTheDocument()
  })

  it('respeta el destino guardado cuando el rol sí puede entrar', async () => {
    await loginAs(ROLES.PLATFORM_ADMIN, '/agentes')

    // El destino guardado sí era alcanzable: se respeta.
    const current = await screen.findByRole('link', { name: messages.nav.agents })
    expect(current).toHaveAttribute('aria-current', 'page')
  })
})

describe('tabla de acceso', () => {
  it('el sidebar no ofrece destinos que el rol no puede abrir', async () => {
    await loginAs(ROLES.MUNICIPAL_AGENT, '/reportes')

    expect(
      await screen.findByRole('link', { name: messages.nav.reports }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: messages.nav.validators }),
    ).toBeInTheDocument()
    // Secciones del administrador: ni siquiera se dibujan.
    expect(
      screen.queryByRole('link', { name: messages.nav.municipalities }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: messages.nav.agents }),
    ).not.toBeInTheDocument()
  })

  it('la raíz manda a cada rol a su primera pantalla', async () => {
    await loginAs(ROLES.PLATFORM_ADMIN, '/')

    const current = await screen.findByRole('link', {
      name: messages.nav.municipalities,
    })
    expect(current).toHaveAttribute('aria-current', 'page')
  })

  it('el administrador no entra al listado de reportes, que es del agente', async () => {
    await loginAs(ROLES.PLATFORM_ADMIN, '/')
    await screen.findByRole('link', { name: messages.nav.municipalities })

    // La API del panel le responde 403: la sección directamente no es suya.
    expect(
      screen.queryByRole('link', { name: messages.nav.reports }),
    ).not.toBeInTheDocument()
  })
})
