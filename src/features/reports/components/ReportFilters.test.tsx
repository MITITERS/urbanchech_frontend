import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { messages } from '@/config/messages'
import { renderWithProviders } from '@/test/renderWithProviders'
import { ReportFilters } from './ReportFilters'
import {
  REPORT_STATUSES,
  type ReportFilters as Filters,
  type ReportOrdering,
} from '../types'

/**
 * Barra de filtros del panel (US-012).
 *
 * Los filtros son de la vista y no del componente: éste solo emite el parche que
 * el hook de la URL aplica. Por eso todo se afirma sobre `onChange`.
 */

const labels = messages.reports.filters

const ORDERINGS: readonly ReportOrdering[] = [
  '-created_at',
  'created_at',
  '-like_count',
  'like_count',
]

const EMPTY: Filters = {
  statuses: [],
  categories: [],
  zone: '',
  createdFrom: '',
  createdTo: '',
  ordering: '-created_at',
  page: 1,
}

function renderFilters(filters: Partial<Filters> = {}, isFiltered = false) {
  const onChange = vi.fn()
  const onClear = vi.fn()
  renderWithProviders(
    <ReportFilters
      filters={{ ...EMPTY, ...filters }}
      orderings={ORDERINGS}
      isFiltered={isFiltered}
      onChange={onChange}
      onClear={onClear}
    />,
  )
  return { onChange, onClear, user: userEvent.setup() }
}

describe('ReportFilters, estado y categoría', () => {
  it('sin selección los desplegables dicen «todos»', () => {
    renderFilters()

    expect(screen.getByRole('button', { name: labels.status })).toHaveTextContent(
      labels.allStatuses,
    )
    expect(screen.getByRole('button', { name: labels.category })).toHaveTextContent(
      labels.allCategories,
    )
  })

  it('con un solo estado elegido muestra su nombre', () => {
    renderFilters({ statuses: [REPORT_STATUSES.IN_PROGRESS] })

    expect(screen.getByRole('button', { name: labels.status })).toHaveTextContent(
      messages.reports.status.en_proceso,
    )
  })

  it('con varios muestra el conteo', () => {
    // El nombre de tres estados no entra en el botón; el número sí.
    renderFilters({
      statuses: [REPORT_STATUSES.REPORTED, REPORT_STATUSES.IN_PROGRESS],
    })

    expect(screen.getByRole('button', { name: labels.status })).toHaveTextContent(
      labels.selected(2),
    )
  })

  it('marcar un estado lo agrega a los ya elegidos', async () => {
    // El OR dentro de un mismo filtro: elegir «En proceso» no descarta
    // «Reportado».
    const { onChange, user } = renderFilters({ statuses: [REPORT_STATUSES.REPORTED] })

    await user.click(screen.getByRole('button', { name: labels.status }))
    await user.click(
      await screen.findByRole('menuitemcheckbox', {
        name: messages.reports.status.en_proceso,
      }),
    )

    expect(onChange).toHaveBeenCalledWith({
      statuses: [REPORT_STATUSES.REPORTED, REPORT_STATUSES.IN_PROGRESS],
    })
  })

  it('desmarcar un estado lo saca de la lista', async () => {
    const { onChange, user } = renderFilters({
      statuses: [REPORT_STATUSES.REPORTED, REPORT_STATUSES.IN_PROGRESS],
    })

    await user.click(screen.getByRole('button', { name: labels.status }))
    await user.click(
      await screen.findByRole('menuitemcheckbox', {
        name: messages.reports.status.reportado,
      }),
    )

    expect(onChange).toHaveBeenCalledWith({ statuses: [REPORT_STATUSES.IN_PROGRESS] })
  })

  it('el menú queda abierto tras marcar, para elegir varios de una', async () => {
    const { user } = renderFilters()

    await user.click(screen.getByRole('button', { name: labels.category }))
    await user.click(
      await screen.findByRole('menuitemcheckbox', {
        name: messages.reports.category.bache,
      }),
    )

    expect(
      screen.getByRole('menuitemcheckbox', { name: messages.reports.category.basura }),
    ).toBeInTheDocument()
  })

  it('ofrece las seis categorías del sistema', async () => {
    const { user } = renderFilters()

    await user.click(screen.getByRole('button', { name: labels.category }))

    expect(await screen.findAllByRole('menuitemcheckbox')).toHaveLength(6)
  })
})

describe('ReportFilters, zona', () => {
  it('no dispara una consulta por tecla: espera al debounce', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const { onChange, user } = renderFilters()

    await user.type(screen.getByLabelText(labels.zone), 'San Martín')

    expect(onChange).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(400)
    await waitFor(() => expect(onChange).toHaveBeenCalledWith({ zone: 'San Martín' }))
    expect(onChange).toHaveBeenCalledOnce()
    vi.useRealTimers()
  })

  it('el borrador se reajusta cuando la zona cambia desde afuera', async () => {
    // El botón «limpiar» y el «atrás» del navegador cambian la URL sin tocar el
    // input: si el borrador no se resincroniza, el texto viejo queda en pantalla.
    const { rerender } = renderWithProviders(
      <ReportFilters
        filters={{ ...EMPTY, zone: 'San Martín' }}
        orderings={ORDERINGS}
        isFiltered
        onChange={vi.fn()}
        onClear={vi.fn()}
      />,
    )
    expect(screen.getByLabelText(labels.zone)).toHaveValue('San Martín')

    rerender(
      <ReportFilters
        filters={EMPTY}
        orderings={ORDERINGS}
        isFiltered={false}
        onChange={vi.fn()}
        onClear={vi.fn()}
      />,
    )

    expect(screen.getByLabelText(labels.zone)).toHaveValue('')
  })
})

describe('ReportFilters, fechas y orden', () => {
  it('emite la fecha desde tal cual la escribe el agente', async () => {
    const { onChange, user } = renderFilters()

    await user.type(screen.getByLabelText(labels.createdFrom), '2026-08-01')

    expect(onChange).toHaveBeenLastCalledWith({ createdFrom: '2026-08-01' })
  })

  it('emite la fecha hasta', async () => {
    const { onChange, user } = renderFilters()

    await user.type(screen.getByLabelText(labels.createdTo), '2026-08-31')

    expect(onChange).toHaveBeenLastCalledWith({ createdTo: '2026-08-31' })
  })

  it('cambia el orden por el valor que acepta la API', async () => {
    const { onChange, user } = renderFilters()

    await user.click(screen.getByRole('combobox', { name: labels.ordering }))
    await user.click(
      await screen.findByRole('option', { name: messages.reports.ordering.mostLiked }),
    )

    expect(onChange).toHaveBeenCalledWith({ ordering: '-like_count' })
  })

  it('lista solo los órdenes que le pasan', async () => {
    // El listado por municipalidad no ofrece el orden por apoyos.
    const onChange = vi.fn()
    renderWithProviders(
      <ReportFilters
        filters={EMPTY}
        orderings={['-created_at', 'created_at']}
        isFiltered={false}
        onChange={onChange}
        onClear={vi.fn()}
      />,
    )
    await userEvent
      .setup()
      .click(screen.getByRole('combobox', { name: labels.ordering }))

    expect(await screen.findAllByRole('option')).toHaveLength(2)
  })
})

describe('ReportFilters, limpiar', () => {
  it('sin filtros aplicados no ofrece limpiar', () => {
    renderFilters()

    expect(screen.queryByRole('button', { name: labels.clear })).not.toBeInTheDocument()
  })

  it('con filtros aplicados, limpiar los descarta todos de una', async () => {
    const { onClear, user } = renderFilters(
      { statuses: [REPORT_STATUSES.REPORTED], zone: 'Centro' },
      true,
    )

    await user.click(screen.getByRole('button', { name: labels.clear }))

    expect(onClear).toHaveBeenCalledOnce()
  })
})
