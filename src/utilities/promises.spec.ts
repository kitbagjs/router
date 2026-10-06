import { expect, test, vi } from 'vitest'
import { createAbortPromise } from '@/utilities/promises'

test('createAbortPromise resolves for an already aborted signal without adding a listener', async () => {
  const controller = new AbortController()
  controller.abort()
  const addListener = vi.spyOn(controller.signal, 'addEventListener')

  await expect(createAbortPromise(controller.signal)).resolves.toBeUndefined()
  expect(addListener).not.toHaveBeenCalled()
})

test('createAbortPromise stays pending until the signal aborts', async () => {
  const controller = new AbortController()
  const resolved = vi.fn()
  const promise = createAbortPromise(controller.signal).then(resolved)

  await Promise.resolve()
  expect(resolved).not.toHaveBeenCalled()

  controller.abort()
  await promise

  expect(resolved).toHaveBeenCalledOnce()
})

test('a later abort does not change a race that already completed', async () => {
  const controller = new AbortController()
  const promise = Promise.race([
    Promise.resolve('ready'),
    createAbortPromise(controller.signal),
  ])

  await expect(promise).resolves.toBe('ready')

  controller.abort()
  await expect(promise).resolves.toBe('ready')
})
