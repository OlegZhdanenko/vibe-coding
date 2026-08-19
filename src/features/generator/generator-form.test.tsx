import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { GeneratorForm } from './generator-form'

function renderForm(overrides: Partial<Parameters<typeof GeneratorForm>[0]> = {}) {
  const onSubmit = vi.fn()
  const onCancel = vi.fn()

  render(<GeneratorForm onSubmit={onSubmit} onCancel={onCancel} busy={false} {...overrides} />)

  return { onSubmit, onCancel }
}

describe('GeneratorForm', () => {
  it('blocks submission when the topic is too short', async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderForm()

    await user.type(screen.getByLabelText(/what is the email about/i), 'too short')
    await user.click(screen.getByRole('button', { name: /generate email/i }))

    expect(await screen.findByText(/at least 10 characters/i)).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits the topic with the default tone, length and language', async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderForm()

    await user.type(
      screen.getByLabelText(/what is the email about/i),
      'Ask my manager for two days off next week',
    )
    await user.click(screen.getByRole('button', { name: /generate email/i }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit).toHaveBeenCalledWith({
      topic: 'Ask my manager for two days off next week',
      tone: 'professional',
      length: 'medium',
      language: 'English',
      recipient: undefined,
    })
  })

  it('passes a recipient through when one is entered', async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderForm()

    await user.type(
      screen.getByLabelText(/what is the email about/i),
      'Ask my manager for two days off next week',
    )
    await user.type(screen.getByLabelText(/recipient/i), '  my manager  ')
    await user.click(screen.getByRole('button', { name: /generate email/i }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit.mock.calls[0]![0]).toMatchObject({ recipient: 'my manager' })
  })

  it('shows a stop button and no submit affordance while generating', async () => {
    const { onCancel } = renderForm({ busy: true })
    const user = userEvent.setup()

    expect(screen.getByRole('button', { name: /writing your email/i })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: /stop/i }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('disables the form when the quota is spent', () => {
    renderForm({ disabled: true })

    expect(screen.getByLabelText(/what is the email about/i)).toBeDisabled()
    expect(screen.getByRole('button', { name: /generate email/i })).toBeDisabled()
  })
})
