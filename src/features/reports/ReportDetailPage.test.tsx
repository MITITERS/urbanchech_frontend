import { screen, waitFor } from '@testing-library/react'
import type * as RouterModule from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/api/client'
import { messages } from '@/config/messages'
import { renderWithProviders } from '@/test/renderWithProviders'
import { ROLES, type Role } from '@/types/auth'
import { ReportDetailPage } from './ReportDetailPage'
import type { PanelReportDetail } from './types'

const VILLA_MARIA = { id: 3, city: 'Villa María', province: 'Córdoba' }

const DETAIL: PanelReportDetail = {
  id: 42,
  number: 7,
  municipality: VILLA_MARIA,
  photo: null,
  description: 'Bache profundo',
  category: 'bache',
  status: 'reportado',
  address: 'Av. Corrientes 1234',
  latitude: '-32.4',
  longitude: '-63.2',
  created_at: '2026-08-20T12:00:00Z',
  updated_at: '2026-08-20T12:00:00Z',
  author: { id: 1, name: 'Vecina', avatar: null },
  like_count: 5,
  comments: [],
  status_history: [],
  available_transitions: [],
  validation: null,
}

const { mockedRole } = vi.hoisted(() => ({
  mockedRole: { current: null as Role | null },
}))
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ role: mockedRole.current }),
}))

// La página lee el id de la ruta; el test la monta suelta, sin esa ruta.
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof RouterModule>()
  return { ...actual, useParams: () => ({ id: '42' }) }
})

beforeEach(() => {
  vi.spyOn(apiClient, 'get').mockResolvedValue({ data: DETAIL })
})

describe('ReportDetailPage — a dónde vuelve cada rol', () => {
  it('el agente vuelve al listado, que es su pantalla', async () => {
    mockedRole.current = ROLES.MUNICIPAL_AGENT

    renderWithProviders(<ReportDetailPage />)

    expect(
      await screen.findByRole('link', { name: messages.reportDetail.backToList }),
    ).toHaveAttribute('href', '/reportes')
  })

  it('el admin vuelve a la municipalidad, no al listado', async () => {
    // El listado es del agente: mandarlo ahí le daba «permisos insuficientes».
    mockedRole.current = ROLES.PLATFORM_ADMIN

    renderWithProviders(<ReportDetailPage />)

    // El botón se dibuja antes de que cargue el reporte, así que arranca en el
    // listado de municipios y se afina cuando llega la jurisdicción.
    await waitFor(() =>
      expect(
        screen.getByRole('link', {
          name: messages.reportDetail.backToMunicipality,
        }),
      ).toHaveAttribute('href', `/municipalidades/${VILLA_MARIA.id}`),
    )
  })

  it('ningún rol queda con un enlace al listado ajeno', async () => {
    mockedRole.current = ROLES.PLATFORM_ADMIN

    renderWithProviders(<ReportDetailPage />)
    await screen.findByRole('link', {
      name: messages.reportDetail.backToMunicipality,
    })

    expect(
      screen.queryByRole('link', { name: messages.reportDetail.backToList }),
    ).not.toBeInTheDocument()
  })

  it('sin municipalidad en el reporte, el admin vuelve al listado de municipios', async () => {
    mockedRole.current = ROLES.PLATFORM_ADMIN
    vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: { ...DETAIL, municipality: null },
    })

    renderWithProviders(<ReportDetailPage />)

    expect(
      await screen.findByRole('link', {
        name: messages.reportDetail.backToMunicipality,
      }),
    ).toHaveAttribute('href', '/municipalidades')
  })

  it('dice qué validador lo confirmó en terreno', async () => {
    // El nombre ya estaba en el historial, mezclado con las acciones del
    // municipio: acá se lee de una.
    mockedRole.current = ROLES.MUNICIPAL_AGENT
    vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: {
        ...DETAIL,
        validation: {
          validator: { id: 5, name: 'Marcos Vera', avatar: null },
          decided_at: '2026-08-21T09:00:00Z',
          outcome: 'validado',
        },
      },
    })

    renderWithProviders(<ReportDetailPage />)

    expect(await screen.findByText('Marcos Vera')).toBeInTheDocument()
    expect(
      screen.getByText(new RegExp(messages.reportDetail.validatedBy)),
    ).toBeVisible()
  })

  it('sin validar todavía, no inventa un validador', async () => {
    mockedRole.current = ROLES.MUNICIPAL_AGENT

    renderWithProviders(<ReportDetailPage />)
    await screen.findByText(/#7/)

    expect(
      screen.queryByText(new RegExp(messages.reportDetail.validatedBy)),
    ).not.toBeInTheDocument()
  })

  it('nombra el reporte por su número de municipio', async () => {
    mockedRole.current = ROLES.MUNICIPAL_AGENT

    renderWithProviders(<ReportDetailPage />)

    expect(await screen.findByText(/#7/)).toBeInTheDocument()
    expect(screen.queryByText(/#42/)).not.toBeInTheDocument()
  })
})
