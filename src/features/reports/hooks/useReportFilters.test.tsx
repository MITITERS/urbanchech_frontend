import { act, renderHook } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { DEFAULT_STATUS_FILTER, REPORT_STATUSES } from '../types'
import { useReportFilters } from './useReportFilters'

function wrapperFor(initialPath: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <MemoryRouter initialEntries={[initialPath]}>{children}</MemoryRouter>
  }
}

function renderFilters(initialPath = '/reportes') {
  return renderHook(() => ({ ...useReportFilters(), location: useLocation() }), {
    wrapper: wrapperFor(initialPath),
  })
}

describe('useReportFilters', () => {
  it('defaults to the three statuses that still need attention', () => {
    const { result } = renderFilters()

    expect(result.current.filters.statuses).toEqual([...DEFAULT_STATUS_FILTER])
    expect(result.current.isFiltered).toBe(false)
  })

  it('reads the filters from the query string', () => {
    const { result } = renderFilters(
      '/reportes?status=resuelto&category=bache,basura&zone=centro&ordering=-like_count&page=3',
    )

    expect(result.current.filters).toMatchObject({
      statuses: [REPORT_STATUSES.RESOLVED],
      categories: ['bache', 'basura'],
      zone: 'centro',
      ordering: '-like_count',
      page: 3,
    })
  })

  it('writes a filter change back into the URL', () => {
    const { result } = renderFilters()

    act(() => result.current.update({ zone: 'rivadavia' }))

    expect(result.current.location.search).toContain('zone=rivadavia')
    expect(result.current.filters.zone).toBe('rivadavia')
  })

  it('goes back to the first page whenever a filter changes', () => {
    const { result } = renderFilters('/reportes?page=4')

    act(() => result.current.update({ categories: ['bache'] }))

    expect(result.current.filters.page).toBe(1)
    expect(result.current.location.search).not.toContain('page=')
  })

  it('keeps the page when only the page changes', () => {
    const { result } = renderFilters()

    act(() => result.current.update({ page: 2 }))

    expect(result.current.filters.page).toBe(2)
  })

  it('ignores unknown values in the query string', () => {
    const { result } = renderFilters('/reportes?status=inventado&ordering=raro')

    expect(result.current.filters.statuses).toEqual([])
    expect(result.current.filters.ordering).toBe('-created_at')
  })

  it('tells an explicitly emptied status filter from an untouched one', () => {
    const untouched = renderFilters('/reportes')
    const emptied = renderFilters('/reportes?status=')

    expect(untouched.result.current.filters.statuses).toEqual([
      ...DEFAULT_STATUS_FILTER,
    ])
    expect(emptied.result.current.filters.statuses).toEqual([])
  })

  it('clears every filter back to the defaults', () => {
    const { result } = renderFilters('/reportes?zone=centro&category=bache&page=2')

    act(() => result.current.clear())

    expect(result.current.location.search).toBe('')
    expect(result.current.filters.statuses).toEqual([...DEFAULT_STATUS_FILTER])
    expect(result.current.isFiltered).toBe(false)
  })
})
