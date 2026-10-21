import { afterEach, expect, test, vi } from 'vitest'
import { warn } from '@/utilities/warn'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

test('forwards all arguments to console.warn in development', () => {
  vi.stubEnv('NODE_ENV', 'development')

  const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const details = { route: 'child' }

  warn('Waiting on props', details)

  expect(consoleWarn).toHaveBeenCalledOnce()
  expect(consoleWarn).toHaveBeenCalledWith('Waiting on props', details)
  expect(consoleWarn.mock.calls[0][1]).toBe(details)
})

test.each(['test', 'production', undefined])('does not warn when NODE_ENV is %s', (environment) => {
  vi.stubEnv('NODE_ENV', environment)

  const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})

  warn('Waiting on props')

  expect(consoleWarn).not.toHaveBeenCalled()
})
