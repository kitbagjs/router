import { expect, test, vi } from 'vitest'
import { createAbortPromise } from '@/utilities/promises'

test('createAbortPromise resolves for an already aborted signal without adding a listener', async () => {
  const controller = new AbortController()
  controller.abort()
  const addListener = vi.spyOn(controller.signal, 'addEventListener')

  await expect(createAbortPromise(controller.signal)).resolves.toBeUndefined()
  expect(addListener).not.toHaveBeenCalled()
})

test('createAbortPromise stays pending until abortion and cleans up its listener', async () => {
  const controller = new AbortController()
  const listener = new AbortController()
  const resolved = vi.fn()
  const promise = createAbortPromise(controller.signal, listener).then(resolved)

  await Promise.resolve()
  expect(resolved).not.toHaveBeenCalled()

  controller.abort()
  await promise

  expect(resolved).toHaveBeenCalledOnce()
  expect(listener.signal.aborted).toBe(true)
})

test('a caller can stop watching without aborting the watched signal or settling the promise', async () => {
  const controller = new AbortController()
  const listener = new AbortController()
  const resolved = vi.fn()
  void createAbortPromise(controller.signal, listener).then(resolved)

  listener.abort()
  expect(controller.signal.aborted).toBe(false)

  controller.abort()
  await Promise.resolve()
  expect(resolved).not.toHaveBeenCalled()
})
