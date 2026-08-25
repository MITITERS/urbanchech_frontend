import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/api/client'
import { messages } from '@/config/messages'
import { renderWithProviders } from '@/test/renderWithProviders'
import { ValidatorsPage } from './ValidatorsPage'
import type { Validator } from './types'

const ACTIVE: Validator = {
  id: 7,
  name: 'Validador Uno',
  email: 'validador@muni.gob.ar',
  is_active_validator: true,
  validation_count: 3,
  must_change_password: false,
}

beforeEach(() => {
  vi.spyOn(apiClient, 'get').mockResolvedValue({ data: { results: [ACTIVE] } })
})

describe('ValidatorsPage', () => {
  it('lists validators with their state and validation count', async () => {
    renderWithProviders(<ValidatorsPage />)

    const row = await screen.findByRole('row', { name: /Validador Uno/ })
    expect(within(row).getByText(messages.validators.active)).toBeInTheDocument()
    expect(within(row).getByText('3')).toBeInTheDocument()
  })

  it('asks for confirmation before deactivating, explaining what is kept', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({
      data: { ...ACTIVE, is_active_validator: false },
    })
    const user = userEvent.setup()

    renderWithProviders(<ValidatorsPage />)
    await user.click(
      await screen.findByRole('button', { name: messages.validators.deactivate }),
    )

    expect(
      await screen.findByText(messages.validators.deactivateDescription),
    ).toBeInTheDocument()
    expect(post).not.toHaveBeenCalled()

    await user.click(
      screen.getByRole('button', { name: messages.validators.deactivateConfirm }),
    )

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith('/api/validators/7/deactivate/'),
    )
  })

  it('does not offer a municipality selector when creating a validator', async () => {
    const user = userEvent.setup()

    renderWithProviders(<ValidatorsPage />)
    await user.click(
      await screen.findByRole('button', { name: messages.validators.create }),
    )

    // La municipalidad la pone el backend: ofrecerla sería un bug de US-035.
    expect(await screen.findByLabelText(messages.validators.name)).toBeInTheDocument()
    expect(screen.queryByText(messages.agents.municipality)).not.toBeInTheDocument()
  })
})
