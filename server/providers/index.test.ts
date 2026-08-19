import { describe, expect, it, vi } from 'vitest'
import { resolveProvider } from './index.js'

/**
 * The provider seam is the part of the system most likely to be changed by
 * whoever picks this up next, so its selection rules are pinned down here.
 */
describe('resolveProvider', () => {
  it('falls back to the offline writer when nothing is configured', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    expect(resolveProvider({}).id).toBe('mock')
    expect(warn).toHaveBeenCalled()

    warn.mockRestore()
  })

  it('prefers Anthropic when both keys are present', () => {
    const provider = resolveProvider({ ANTHROPIC_API_KEY: 'sk-ant-x', GEMINI_API_KEY: 'g-x' })
    expect(provider.id).toBe('anthropic')
  })

  it('uses Gemini when only its key is present', () => {
    const provider = resolveProvider({ GEMINI_API_KEY: 'g-x' })
    expect(provider.id).toBe('gemini')
  })

  it('honours an explicit choice over the available keys', () => {
    const provider = resolveProvider({
      EMAIL_PROVIDER: 'gemini',
      ANTHROPIC_API_KEY: 'sk-ant-x',
      GEMINI_API_KEY: 'g-x',
    })
    expect(provider.id).toBe('gemini')
  })

  it('forces the offline writer when asked, even with keys available', () => {
    const provider = resolveProvider({ EMAIL_PROVIDER: 'mock', ANTHROPIC_API_KEY: 'sk-ant-x' })
    expect(provider.id).toBe('mock')
  })

  it('fails loudly when a provider is pinned without its key', () => {
    expect(() => resolveProvider({ EMAIL_PROVIDER: 'gemini' })).toThrow(/GEMINI_API_KEY/)
    expect(() => resolveProvider({ EMAIL_PROVIDER: 'anthropic' })).toThrow(/ANTHROPIC_API_KEY/)
  })

  it('ignores an unrecognised value rather than crashing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    expect(resolveProvider({ EMAIL_PROVIDER: 'llama', GEMINI_API_KEY: 'g-x' }).id).toBe('gemini')

    warn.mockRestore()
  })

  it('exposes the model name each provider records against saved drafts', () => {
    expect(resolveProvider({ EMAIL_PROVIDER: 'mock' }).model).toBeTruthy()
    expect(resolveProvider({ GEMINI_API_KEY: 'g-x' }).model).toContain('gemini')
  })
})
