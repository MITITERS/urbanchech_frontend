import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { messages } from '@/config/messages'
import { StatusHistory } from './StatusHistory'
import { REPORT_STATUSES, type StatusHistoryEntry } from '../types'

/**
 * Historial de cambios de estado (US-013, escenario 7).
 *
 * Es la trazabilidad del reclamo: quién lo movió, cuándo, y por qué cuando hizo
 * falta un motivo.
 */

const labels = messages.reportDetail

const AGENT = { id: 7, name: 'Ana Agente', avatar: null }

const HISTORY: StatusHistoryEntry[] = [
  {
    previous_status: '',
    status: REPORT_STATUSES.PENDING_VALIDATION,
    changed_by: null,
    reason: '',
    created_at: '2026-08-20T12:00:00Z',
  },
  {
    previous_status: REPORT_STATUSES.REPORTED,
    status: REPORT_STATUSES.IN_PROGRESS,
    changed_by: AGENT,
    reason: '',
    created_at: '2026-08-21T09:30:00Z',
  },
  {
    previous_status: REPORT_STATUSES.IN_PROGRESS,
    status: REPORT_STATUSES.CANCELLED,
    changed_by: AGENT,
    reason: 'El bache ya lo reparó la empresa de gas.',
    created_at: '2026-08-22T15:45:00Z',
  },
]

describe('StatusHistory', () => {
  it('sin movimientos lo dice en lugar de dejar el hueco vacío', () => {
    render(<StatusHistory entries={[]} />)

    expect(screen.getByText(labels.historyEmpty)).toBeInTheDocument()
  })

  it('el primer asiento es el alta, no una transición', () => {
    // Sin estado previo no hay flecha que dibujar: es cuando nació el reporte.
    render(<StatusHistory entries={[HISTORY[0]]} />)

    expect(screen.getByText(labels.initialStatus)).toBeInTheDocument()
  })

  it('cada transición muestra de qué estado a cuál', () => {
    render(<StatusHistory entries={HISTORY} />)

    expect(
      screen.getByText(
        `${messages.reports.status.reportado} → ${messages.reports.status.en_proceso}`,
      ),
    ).toBeInTheDocument()
  })

  it('nombra a quien ejecutó el cambio', () => {
    render(<StatusHistory entries={HISTORY} />)

    expect(screen.getAllByText(new RegExp(AGENT.name)).length).toBeGreaterThan(0)
  })

  it('muestra el motivo cuando la transición lo exigió', () => {
    render(<StatusHistory entries={HISTORY} />)

    expect(
      screen.getByText('El bache ya lo reparó la empresa de gas.'),
    ).toBeInTheDocument()
    // Y solo ahí: las transiciones sin motivo no dibujan la etiqueta.
    expect(screen.getAllByText(`${labels.reason}:`)).toHaveLength(1)
  })

  it('lista un asiento por movimiento', () => {
    render(<StatusHistory entries={HISTORY} />)

    expect(screen.getAllByRole('listitem')).toHaveLength(3)
  })
})
