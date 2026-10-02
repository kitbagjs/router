import { describe, expect, test, vi } from 'vitest'
import { withAbortSignal } from '@/utilities/withAbortSignal'

describe('withAbortSignal', () => {
  test('returns completed work and removes the abort listener', async () => {
    const controller = new AbortController()
    const listen = vi.spyOn(controller.signal, 'addEventListener')

    await expect(withAbortSignal(Promise.resolve('ready'), controller.signal)).resolves.toBe('ready')

    const listener = listen.mock.calls[0][2] as AbortController

    expect(listener.signal.aborted).toBe(true)
  })

  test('preserves callback errors and removes the abort listener', async () => {
    const controller = new AbortController()
    const listen = vi.spyOn(controller.signal, 'addEventListener')
    const error = new Error('Loader failed')

    await expect(withAbortSignal(Promise.reject(error), controller.signal)).rejects.toBe(error)

    const listener = listen.mock.calls[0][2] as AbortController

    expect(listener.signal.aborted).toBe(true)
  })

  test('cancellation settles even if the work never resolves', async () => {
    const controller = new AbortController()
    const pending = withAbortSignal(new Promise(() => {}), controller.signal)

    controller.abort()

    await expect(pending).rejects.toBe(controller.signal.reason)
  })

  test('an already canceled signal still observes rejected work', async () => {
    const controller = new AbortController()

    controller.abort()

    await expect(withAbortSignal(Promise.reject(new Error('Stale callback')), controller.signal)).rejects.toBe(controller.signal.reason)
  })
})
