import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import { messages } from '@/config/messages'
import { renderWithProviders } from '@/test/renderWithProviders'
import { PrivacyRequestsPage } from './PrivacyRequestsPage'
import type { PrivacyRequest } from './types'

/** El config de la instancia compartida, sin importar axios (regla del repo). */
type RequestConfig = Parameters<typeof apiClient.get>[1]

const HOUR_MS = 3_600_000

function request(overrides: Partial<PrivacyRequest> = {}): PrivacyRequest {
  return {
    id: 1,
    reason: 'dato_personal',
    reason_label: 'Dato personal visible',
    status: 'pendiente',
    received_at: new Date(Date.now() - 3 * HOUR_MS).toISOString(),
    // 21 h y media: lejos del borde de la hora, que es lo que miran los tests.
    deadline: new Date(Date.now() + 21.5 * HOUR_MS).toISOString(),
    remaining_seconds: 21.5 * 3600,
    is_overdue: false,
    resolved_at: null,
    resolved_by: null,
    resolved_within_deadline: null,
    image: {
      kind: 'report',
      evidence_id: null,
      appeal_id: null,
      url: 'https://example.test/face.jpg',
    },
    report: {
      id: 42,
      number: 7,
      description: 'Bache frente a la escuela',
      category: 'bache',
      status: 'reportado',
      address: 'Av. Siempre Viva 742',
      municipality: { id: 3, city: 'Villa María', province: 'Córdoba' },
    },
    reporter: { id: 9, name: 'Vecina', email: 'vecina@example.test' },
    ...overrides,
  }
}

const OVERDUE = request({
  id: 2,
  received_at: new Date(Date.now() - 26.5 * HOUR_MS).toISOString(),
  deadline: new Date(Date.now() - 2.5 * HOUR_MS).toISOString(),
  is_overdue: true,
  report: { ...request().report, id: 43, number: 8 },
})

const RESOLVED = request({
  id: 3,
  status: 'imagen_eliminada',
  resolved_at: new Date(Date.now() - HOUR_MS).toISOString(),
  resolved_by: { id: 1, name: 'Admin Plataforma', email: 'admin@example.test' },
  resolved_within_deadline: true,
  remaining_seconds: null,
  image: { kind: 'report', evidence_id: null, appeal_id: null, url: null },
})

function stubApi({
  pending = [OVERDUE, request()],
  resolved = [RESOLVED],
}: { pending?: PrivacyRequest[]; resolved?: PrivacyRequest[] } = {}) {
  return vi
    .spyOn(apiClient, 'get')
    .mockImplementation(async (_url: string, config?: RequestConfig) => {
      const state = (config?.params as { state?: string } | undefined)?.state
      const results = state === 'resolved' ? resolved : pending
      return { data: { count: results.length, results } } as never
    })
}

beforeEach(() => {
  stubApi()
})

describe('PrivacyRequestsPage', () => {
  it('CP-043-86 (US-043 E4) · lista las pendientes con la imagen, el reporte y su municipio', async () => {
    renderWithProviders(<PrivacyRequestsPage />)

    const row = await screen.findByRole('row', { name: /Reporte #7/ })
    expect(
      within(row).getByRole('img', { name: messages.privacy.reportPhoto }),
    ).toHaveAttribute('src', 'https://example.test/face.jpg')
    expect(within(row).getByText(/Villa María/)).toBeInTheDocument()
    expect(within(row).getByText(/^Quedan 21 h/)).toBeInTheDocument()
  })

  it('CP-043-87 (US-043 E1) · la foto de una objeción se nombra como tal (US-043, escenario 1)', async () => {
    stubApi({
      pending: [
        request({
          image: {
            kind: 'resolution_appeal',
            evidence_id: null,
            appeal_id: 5,
            url: 'https://example.test/objecion.jpg',
          },
        }),
      ],
    })
    renderWithProviders(<PrivacyRequestsPage />)

    const row = await screen.findByRole('row', { name: /Reporte #7/ })
    expect(
      within(row).getByRole('img', { name: messages.privacy.appealPhoto }),
    ).toHaveAttribute('src', 'https://example.test/objecion.jpg')
  })

  it('CP-043-88 (US-043 E4 y E7) · respeta el orden del servidor y señala la que está fuera de plazo', async () => {
    renderWithProviders(<PrivacyRequestsPage />)

    const rows = await screen.findAllByRole('row', { name: /Reporte #/ })
    expect(rows[0]).toHaveTextContent('Reporte #8')
    expect(within(rows[0]).getByText(messages.privacy.overdue)).toBeInTheDocument()
    expect(within(rows[0]).getByText(/^Vencida hace 2 h/)).toBeInTheDocument()
    expect(within(rows[1]).queryByText(messages.privacy.overdue)).toBeNull()
  })

  it('CP-043-89 (US-043 E5) · eliminar pide confirmación y avisa que es irreversible', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({
      data: { ...request(), status: 'imagen_eliminada' },
    } as never)
    const user = userEvent.setup()
    renderWithProviders(<PrivacyRequestsPage />)

    const row = await screen.findByRole('row', { name: /Reporte #7/ })
    await user.click(
      within(row).getByRole('button', { name: messages.privacy.removeImage }),
    )

    // Abrir el diálogo no borra nada.
    expect(await screen.findByText(messages.privacy.removeDescription)).toBeVisible()
    expect(messages.privacy.removeDescription).toMatch(/no se puede recuperar/)
    expect(post).not.toHaveBeenCalled()

    await user.click(
      screen.getByRole('button', { name: messages.privacy.removeConfirm }),
    )

    expect(post).toHaveBeenCalledWith(endpoints.privacyRequests.removeImage(1))
  })

  it('CP-043-90 (US-043 E6) · desestimar va por su propio endpoint, también con confirmación', async () => {
    const post = vi
      .spyOn(apiClient, 'post')
      .mockResolvedValue({ data: { ...request(), status: 'desestimada' } } as never)
    const user = userEvent.setup()
    renderWithProviders(<PrivacyRequestsPage />)

    const row = await screen.findByRole('row', { name: /Reporte #7/ })
    await user.click(
      within(row).getByRole('button', { name: messages.privacy.dismiss }),
    )
    await user.click(
      await screen.findByRole('button', { name: messages.privacy.dismissConfirm }),
    )

    expect(post).toHaveBeenCalledWith(endpoints.privacyRequests.dismiss(1))
  })

  it('CP-043-91 (US-043 E5) · cancelar la confirmación no resuelve nada', async () => {
    const post = vi.spyOn(apiClient, 'post')
    const user = userEvent.setup()
    renderWithProviders(<PrivacyRequestsPage />)

    const row = await screen.findByRole('row', { name: /Reporte #7/ })
    await user.click(
      within(row).getByRole('button', { name: messages.privacy.removeImage }),
    )
    await user.click(
      await screen.findByRole('button', { name: messages.common.cancel }),
    )

    expect(post).not.toHaveBeenCalled()
  })

  it('CP-043-92 (US-043 E8) · el registro muestra la decisión, quién y si fue en plazo', async () => {
    const user = userEvent.setup()
    renderWithProviders(<PrivacyRequestsPage />)

    await user.click(
      await screen.findByRole('tab', { name: messages.privacy.tabResolved }),
    )

    const row = await screen.findByRole('row', { name: /Reporte #7/ })
    expect(
      within(row).getByText(messages.privacy.status.imagen_eliminada),
    ).toBeInTheDocument()
    expect(within(row).getByText(/Admin Plataforma/)).toBeInTheDocument()
    expect(within(row).getByText(messages.privacy.withinDeadline)).toBeInTheDocument()
    expect(within(row).getByText(messages.privacy.imageGone)).toBeInTheDocument()
    expect(
      within(row).queryByRole('button', { name: messages.privacy.removeImage }),
    ).toBeNull()
  })

  it('CP-043-93 (US-043 E4) · sin pendientes lo dice en vez de dibujar una tabla vacía', async () => {
    stubApi({ pending: [] })
    renderWithProviders(<PrivacyRequestsPage />)

    expect(await screen.findByText(messages.privacy.emptyPending)).toBeVisible()
  })
})
