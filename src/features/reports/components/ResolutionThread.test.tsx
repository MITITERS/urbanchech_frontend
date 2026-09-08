import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { messages } from '@/config/messages'
import { renderWithProviders } from '@/test/renderWithProviders'
import { ObjectionDeadline, ResolutionThread } from './ResolutionThread'
import type { PanelReportDetail, ResolutionAppeal, ResolutionEvidence } from '../types'

const VILLA_MARIA = { id: 3, city: 'Villa María', province: 'Córdoba' }
const OBRAS = { id: 9, name: 'Obras Públicas', is_active: true }
const OPERATOR = { id: 21, name: 'Ramón Operario', avatar: null }

function evidence(overrides: Partial<ResolutionEvidence> = {}): ResolutionEvidence {
  return {
    id: 1,
    photo: 'https://example.test/work.jpg',
    description: 'Se rellenó el bache con asfalto en frío.',
    created_at: '2026-09-01T10:00:00Z',
    operator: OPERATOR,
    operational_area: OBRAS,
    latitude: '-32.41',
    longitude: '-63.24',
    ...overrides,
  }
}

function appeal(overrides: Partial<ResolutionAppeal> = {}): ResolutionAppeal {
  return {
    id: 1,
    photo: 'https://example.test/appeal.jpg',
    reason: 'El bache sigue igual que antes.',
    created_at: '2026-09-02T10:00:00Z',
    author: { id: 1, name: 'Vecina', avatar: null },
    evidence: evidence(),
    ...overrides,
  }
}

function detail(overrides: Partial<PanelReportDetail> = {}): PanelReportDetail {
  return {
    id: 42,
    number: 7,
    municipality: VILLA_MARIA,
    photo: null,
    description: 'Bache profundo',
    category: 'bache',
    status: 'resuelto_pendiente_confirmacion',
    address: 'Av. Corrientes 1234',
    latitude: '-32.4',
    longitude: '-63.2',
    created_at: '2026-08-20T12:00:00Z',
    updated_at: '2026-08-20T12:00:00Z',
    author: { id: 1, name: 'Vecina', avatar: null },
    like_count: 0,
    comments: [],
    status_history: [],
    available_transitions: [],
    validation: null,
    operational_area: OBRAS,
    area_assigned_at: '2026-08-21T09:00:00Z',
    area_assignments: [],
    archived_at: null,
    official_responses: [],
    can_publish_official_response: false,
    resolution_evidences: [evidence()],
    resolution_appeals: [],
    closed_at: '2026-09-01T10:00:00Z',
    objection_deadline: '2026-09-08T10:00:00Z',
    appeal_count: 0,
    ...overrides,
  }
}

describe('ResolutionThread', () => {
  it('muestra el parte de trabajo con su área', () => {
    renderWithProviders(<ResolutionThread report={detail()} />)

    expect(screen.getByText(/Se rellenó el bache/)).toBeInTheDocument()
    expect(screen.getByText(new RegExp(OBRAS.name))).toBeInTheDocument()
  })

  it('el panel sí ve al operario que ejecutó el cierre', () => {
    // Escenario 13 de US-046: es lo que permite auditar el trabajo. Ante el
    // ciudadano responde el área, y eso lo resuelve el serializer público.
    renderWithProviders(<ResolutionThread report={detail()} />)

    expect(screen.getByText(new RegExp(OPERATOR.name))).toBeInTheDocument()
  })

  it('sin cierre registrado lo dice en lugar de dejar el hueco', () => {
    renderWithProviders(
      <ResolutionThread report={detail({ resolution_evidences: [] })} />,
    )

    expect(screen.getByText(messages.reportDetail.resolutionEmpty)).toBeInTheDocument()
  })

  it('conserva los dos cierres cuando hubo una apelación', () => {
    // Escenario 9 de US-048: el segundo cierre no pisa al primero, y la gracia
    // es poder compararlos.
    const first = evidence({ id: 1, description: 'Primer intento.' })
    const second = evidence({ id: 2, description: 'Segundo intento.' })

    renderWithProviders(
      <ResolutionThread
        report={detail({
          resolution_evidences: [first, second],
          resolution_appeals: [appeal({ evidence: first })],
        })}
      />,
    )

    expect(screen.getByText('Primer intento.')).toBeInTheDocument()
    expect(screen.getByText('Segundo intento.')).toBeInTheDocument()
    expect(screen.getByText(/El bache sigue igual/)).toBeInTheDocument()
  })

  it('la objeción cuelga del cierre que objetó, no de la lista suelta', () => {
    const first = evidence({ id: 1, description: 'Primer intento.' })
    const second = evidence({ id: 2, description: 'Segundo intento.' })

    renderWithProviders(
      <ResolutionThread
        report={detail({
          resolution_evidences: [first, second],
          resolution_appeals: [appeal({ evidence: second })],
        })}
      />,
    )

    // La objeción aparece una sola vez, bajo el cierre correspondiente.
    expect(screen.getAllByText(messages.reportDetail.appeal)).toHaveLength(1)
  })
})

describe('ObjectionDeadline', () => {
  it('muestra hasta cuándo el vecino puede objetar', () => {
    renderWithProviders(<ObjectionDeadline report={detail()} />)

    expect(screen.getByText(/puede objetar el cierre hasta/)).toBeInTheDocument()
  })

  it('no dibuja nada cuando no corre ningún plazo', () => {
    renderWithProviders(
      <ObjectionDeadline report={detail({ objection_deadline: null })} />,
    )

    expect(screen.queryByText(/puede objetar el cierre hasta/)).toBeNull()
  })
})
