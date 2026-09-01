import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type * as RouterModule from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/api/client'
import { messages } from '@/config/messages'
import { renderWithProviders } from '@/test/renderWithProviders'
import { MunicipalityDetailPage } from './MunicipalityDetailPage'
import type { MunicipalityDetail, MunicipalityReportMarker } from './types'
import type { PanelReportRow } from '@/features/reports/types'

/**
 * Ficha de un municipio, vista por el administrador de la plataforma (US-017).
 *
 * Es la única pantalla del panel que se acota por el municipio de la URL y no
 * por la jurisdicción del usuario, así que lo que se prueba es que pida los
 * datos de *ese* municipio y que las dos vistas —lista y mapa— muestren lo mismo.
 */

const labels = messages.municipalities

const VILLA_MARIA: MunicipalityDetail = {
  id: 3,
  city: 'Villa María',
  province: 'Córdoba',
  latitude: '-32.410300',
  longitude: '-63.240000',
  coverage_radius_km: '15.00',
  is_active: true,
  report_count: 2,
  user_count: 4,
  created_at: '2026-08-01T10:00:00Z',
}

const REPORT: PanelReportRow = {
  id: 42,
  number: 7,
  category: 'bache',
  status: 'reportado',
  created_at: '2026-08-20T12:00:00Z',
  address: 'Av. Corrientes 1234',
  latitude: '-32.4',
  longitude: '-63.2',
  like_count: 5,
  operative_area: 'Obras Públicas',
  municipality: VILLA_MARIA,
  author: { id: 1, name: 'Vecina', avatar: null },
}

const MARKER: MunicipalityReportMarker = {
  id: 42,
  number: 7,
  category: 'bache',
  status: 'reportado',
  latitude: '-32.4',
  longitude: '-63.2',
  address: 'Av. Corrientes 1234',
}

// La página lee el id de la ruta; el test la monta suelta, sin esa ruta.
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof RouterModule>()
  return { ...actual, useParams: () => ({ id: '3' }) }
})

interface StubOptions {
  municipality?: MunicipalityDetail
  reports?: PanelReportRow[]
  markers?: MunicipalityReportMarker[]
  failOn?: string
}

function stubApi({
  municipality = VILLA_MARIA,
  reports = [REPORT],
  markers = [MARKER],
  failOn,
}: StubOptions = {}) {
  return vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
    if (failOn && url.includes(failOn)) throw new Error('boom')
    if (url.endsWith('/reports/map/')) return { data: { results: markers } } as never
    if (url.endsWith('/reports/')) {
      return {
        data: { count: reports.length, next: null, previous: null, results: reports },
      } as never
    }
    return { data: municipality } as never
  })
}

beforeEach(() => {
  stubApi()
})

describe('MunicipalityDetailPage, cabecera', () => {
  it('pide los datos del municipio de la URL', async () => {
    const get = stubApi()

    renderWithProviders(<MunicipalityDetailPage />)

    await waitFor(() => expect(get).toHaveBeenCalledWith('/api/municipalities/3/'))
    expect(get).toHaveBeenCalledWith('/api/municipalities/3/reports/')
    expect(get).toHaveBeenCalledWith('/api/municipalities/3/reports/map/')
  })

  it('titula con la ciudad y la provincia', async () => {
    renderWithProviders(<MunicipalityDetailPage />)

    expect(await screen.findByText('Villa María, Córdoba')).toBeInTheDocument()
  })

  it('resume radio, reportes y usuarios', async () => {
    renderWithProviders(<MunicipalityDetailPage />)

    expect(await screen.findByText(`${labels.radius}: 15 km`)).toBeInTheDocument()
    expect(screen.getByText(`${labels.reports}: 2`)).toBeInTheDocument()
    expect(screen.getByText(`${labels.users}: 4`)).toBeInTheDocument()
  })

  it('un municipio sin cobertura definida no muestra la insignia de radio', async () => {
    stubApi({ municipality: { ...VILLA_MARIA, coverage_radius_km: null } })

    renderWithProviders(<MunicipalityDetailPage />)

    await screen.findByText('Villa María, Córdoba')
    expect(screen.queryByText(/^Radio/)).not.toBeInTheDocument()
  })

  it('ofrece la vuelta al listado', async () => {
    renderWithProviders(<MunicipalityDetailPage />)

    expect(screen.getByRole('link', { name: labels.backToList })).toHaveAttribute(
      'href',
      '/municipalidades',
    )
  })

  it('si el municipio no carga, no dibuja la ficha a medias', async () => {
    stubApi({ failOn: '/api/municipalities/3/' })

    renderWithProviders(<MunicipalityDetailPage />)

    expect(await screen.findByText(messages.common.loadError)).toBeInTheDocument()
    expect(screen.queryByText('Villa María, Córdoba')).not.toBeInTheDocument()
  })
})

describe('MunicipalityDetailPage, reportes', () => {
  it('arranca en la lista y muestra los reportes del municipio', async () => {
    renderWithProviders(<MunicipalityDetailPage />)

    expect(await screen.findByRole('link', { name: '#7' })).toHaveAttribute(
      'href',
      '/reportes/42',
    )
    expect(screen.getByText('Av. Corrientes 1234')).toBeInTheDocument()
  })

  it('un municipio sin reportes lo dice en lugar de mostrar una tabla vacía', async () => {
    stubApi({ reports: [] })

    renderWithProviders(<MunicipalityDetailPage />)

    expect(await screen.findByText(labels.noReports)).toBeInTheDocument()
  })

  it('el error del listado no se lleva puesta la cabecera', async () => {
    // La ficha del municipio se cargó bien: solo falló su tabla de reportes.
    stubApi({ failOn: '/reports/' })

    renderWithProviders(<MunicipalityDetailPage />)

    expect(await screen.findByText('Villa María, Córdoba')).toBeInTheDocument()
    expect(await screen.findAllByText(messages.common.loadError)).not.toHaveLength(0)
  })

  it('se puede pasar al mapa y volver a la lista', async () => {
    const user = userEvent.setup()
    renderWithProviders(<MunicipalityDetailPage />)
    await screen.findByText('Villa María, Córdoba')

    await user.click(screen.getByRole('tab', { name: labels.viewMap }))
    expect(screen.getByRole('tab', { name: labels.viewMap })).toHaveAttribute(
      'aria-selected',
      'true',
    )

    await user.click(screen.getByRole('tab', { name: labels.viewList }))
    expect(await screen.findByRole('link', { name: '#7' })).toBeInTheDocument()
  })

  it('sin marcadores ni centro, el mapa explica por qué está vacío', async () => {
    // Un reporte sin coordenadas existe en la lista pero no se puede ubicar.
    stubApi({
      municipality: { ...VILLA_MARIA, latitude: null, longitude: null },
      markers: [],
    })
    const user = userEvent.setup()

    renderWithProviders(<MunicipalityDetailPage />)
    await screen.findByText('Villa María, Córdoba')
    await user.click(screen.getByRole('tab', { name: labels.viewMap }))

    expect(await screen.findByText(labels.noMarkers)).toBeInTheDocument()
  })
})
