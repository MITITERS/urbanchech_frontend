import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as authApi from '@/api/auth'
import { apiClient } from '@/api/client'
import { SESSION_TOKEN_KEY } from '@/config/constants'
import { messages } from '@/config/messages'
import { AppRoutes } from '@/routes'
import { renderWithProviders } from '@/test/renderWithProviders'
import { ROLES, type AuthUser, type Role } from '@/types/auth'

function buildUser(role: Role, overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: 1,
    email: 'usuario@urbancheck.test',
    name: 'Usuario de prueba',
    role,
    municipality: { id: 1, city: 'Villa María', province: 'Córdoba' },
    mustChangePassword: false,
    ...overrides,
  }
}

function signedInAs(user: AuthUser) {
  window.localStorage.setItem(SESSION_TOKEN_KEY, 'token-de-prueba')
  vi.spyOn(authApi, 'fetchCurrentUser').mockResolvedValue(user)
}

beforeEach(() => {
  // The connectivity check on /reportes must not hit the network in tests.
  vi.spyOn(apiClient, 'get').mockResolvedValue({
    data: { count: 0, next: null, previous: null, results: [] },
  })
})

describe('ProtectedRoute', () => {
  it('sends an anonymous visitor to the login screen', async () => {
    renderWithProviders(<AppRoutes />, { route: '/reportes' })

    expect(await screen.findByText(messages.auth.loginTitle)).toBeInTheDocument()
  })

  it('lets a municipal agent through to a protected route', async () => {
    signedInAs(buildUser(ROLES.MUNICIPAL_AGENT))

    renderWithProviders(<AppRoutes />, { route: '/reportes' })

    expect(
      await screen.findByRole('link', { name: messages.nav.reports }),
    ).toBeInTheDocument()
  })

  it('shows the insufficient-permissions screen to a non municipal role', async () => {
    signedInAs(buildUser(ROLES.CITIZEN))

    renderWithProviders(<AppRoutes />, { route: '/reportes' })

    expect(await screen.findByText(messages.forbidden.title)).toBeInTheDocument()
  })

  it('keeps an agent with a temporary password on the change-password screen', async () => {
    signedInAs(buildUser(ROLES.MUNICIPAL_AGENT, { mustChangePassword: true }))

    renderWithProviders(<AppRoutes />, { route: '/reportes' })

    expect(await screen.findByText(messages.changePassword.title)).toBeInTheDocument()
  })

  it('cannot be skipped by typing another URL while the password is temporary', async () => {
    signedInAs(
      buildUser(ROLES.PLATFORM_ADMIN, {
        municipality: null,
        mustChangePassword: true,
      }),
    )

    renderWithProviders(<AppRoutes />, { route: '/municipalidades' })

    expect(await screen.findByText(messages.changePassword.title)).toBeInTheDocument()
  })

  it('denies a municipal agent a platform-admin-only route', async () => {
    signedInAs(buildUser(ROLES.MUNICIPAL_AGENT))

    renderWithProviders(<AppRoutes />, { route: '/municipalidades' })

    expect(await screen.findByText(messages.forbidden.title)).toBeInTheDocument()
  })
})
