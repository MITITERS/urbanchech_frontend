import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { apiClient, createApiError } from '@/api/client'
import { messages } from '@/config/messages'
import { renderWithProviders } from '@/test/renderWithProviders'
import { TransitionActions } from './TransitionActions'
import { REPORT_STATUSES, type AvailableTransition } from '../types'

const IN_PROGRESS_TRANSITIONS: AvailableTransition[] = [
  { operation: 'resolver', target: REPORT_STATUSES.RESOLVED, requires_reason: false },
  { operation: 'cancelar', target: REPORT_STATUSES.CANCELLED, requires_reason: true },
  { operation: 'archivar', target: REPORT_STATUSES.ARCHIVED, requires_reason: false },
]

describe('TransitionActions', () => {
  it('renders only the transitions the backend offers', () => {
    renderWithProviders(
      <TransitionActions reportId={1} transitions={IN_PROGRESS_TRANSITIONS} />,
    )

    expect(
      screen.getByRole('button', { name: messages.transitions.resolver.label }),
    ).toBeInTheDocument()
    // "Comenzar gestión" no aplica a un reporte En proceso: no se dibuja.
    expect(
      screen.queryByRole('button', { name: messages.transitions.procesar.label }),
    ).not.toBeInTheDocument()
  })

  it('asks for confirmation before running a transition', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({ data: {} })
    const user = userEvent.setup()

    renderWithProviders(
      <TransitionActions reportId={7} transitions={IN_PROGRESS_TRANSITIONS} />,
    )
    await user.click(
      screen.getByRole('button', { name: messages.transitions.resolver.label }),
    )

    expect(post).not.toHaveBeenCalled()
    await user.click(
      await screen.findByRole('button', {
        name: messages.transitions.resolver.label,
        // El botón del diálogo, no el de la lista.
        hidden: false,
      }),
    )

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith('/api/panel/reports/7/resolve/', {}),
    )
  })

  it('refuses to cancel without a reason and sends it once written', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({ data: {} })
    const user = userEvent.setup()

    renderWithProviders(
      <TransitionActions reportId={7} transitions={IN_PROGRESS_TRANSITIONS} />,
    )
    await user.click(
      screen.getByRole('button', { name: messages.transitions.cancelar.label }),
    )
    const confirmButton = (
      await screen.findAllByRole('button', {
        name: messages.transitions.cancelar.label,
      })
    ).at(-1)!
    await user.click(confirmButton)

    expect(
      await screen.findByText('Indicá el motivo para poder continuar.'),
    ).toBeInTheDocument()
    expect(post).not.toHaveBeenCalled()

    await user.type(
      screen.getByLabelText(messages.reportDetail.reasonLabel),
      'Obra ya ejecutada',
    )
    await user.click(confirmButton)

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith('/api/panel/reports/7/cancel/', {
        reason: 'Obra ya ejecutada',
      }),
    )
  })

  it('reports a conflict when the report moved underneath the agent', async () => {
    vi.spyOn(apiClient, 'post').mockRejectedValue(
      createApiError(409, 'Estado desactualizado'),
    )
    const user = userEvent.setup()

    renderWithProviders(
      <TransitionActions reportId={7} transitions={IN_PROGRESS_TRANSITIONS} />,
    )
    await user.click(
      screen.getByRole('button', { name: messages.transitions.archivar.label }),
    )
    const confirmButton = (
      await screen.findAllByRole('button', {
        name: messages.transitions.archivar.label,
      })
    ).at(-1)!
    await user.click(confirmButton)

    expect(await screen.findByText(messages.reportDetail.conflict)).toBeInTheDocument()
  })
})
