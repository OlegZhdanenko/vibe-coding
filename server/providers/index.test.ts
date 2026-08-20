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

  it('uses Gemini when its key is present', () => {
    expect(resolveProvider({ GEMINI_API_KEY: 'g-x' }).id).toBe('gemini')
  })

  it('forces the offline writer when asked, even with a key available', () => {
    expect(resolveProvider({ EMAIL_PROVIDER: 'mock', GEMINI_API_KEY: 'g-x' }).id).toBe('mock')
  })

  it('fails loudly when a provider is pinned without its key', () => {
    expect(() => resolveProvider({ EMAIL_PROVIDER: 'gemini' })).toThrow(/GEMINI_API_KEY/)
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
