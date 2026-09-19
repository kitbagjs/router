import { afterEach, expect, test, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { ref, watch, watchEffect } from 'vue'
import { createViewTransitions } from '@/services/createViewTransitions'
import { stubViewTransitions } from '@/utilities/testHelpers'

let restore = (): void => {}

afterEach(() => {
  restore()
})

test('the update does not run until the browser runs the callback', async () => {
  const stub = stubViewTransitions()
  const update = vi.fn()
  restore = stub.restore

  createViewTransitions().start(update, [])
  await flushPromises()

  expect(update).not.toHaveBeenCalled()

  await stub.transitions[0].run()

  expect(update).toHaveBeenCalledOnce()
})

test('resolves with the transition once the update has run', async () => {
  const stub = stubViewTransitions()
  restore = stub.restore

  const started = createViewTransitions().start(() => {}, [])
  const settled = vi.fn()

  started.then(settled)
  await flushPromises()

  expect(settled).not.toHaveBeenCalled()

  await stub.transitions[0].run()

  await expect(started).resolves.toMatchObject({ ready: expect.any(Promise) })
})

test('the callback waits for vue to render what the update changed', async () => {
  const stub = stubViewTransitions()
  restore = stub.restore

  const source = ref(0)
  const settledLater = ref(0)
  const rendered: number[] = []

  watch(source, async (value) => {
    await Promise.resolve()
    settledLater.value = value
  })

  watchEffect(() => {
    rendered.push(settledLater.value)
  })

  createViewTransitions().start(() => {
    source.value = 1
  }, [])

  await stub.transitions[0].run()

  expect(rendered).toContain(1)
})

test('a navigation arriving before the callback runs takes over the pending update', async () => {
  const stub = stubViewTransitions()
  restore = stub.restore

  const first = vi.fn()
  const second = vi.fn()
  const viewTransitions = createViewTransitions()

  const firstStarted = viewTransitions.start(first, [])
  const secondStarted = viewTransitions.start(second, [])

  expect(stub.transitions).toHaveLength(1)

  await stub.transitions[0].run()

  expect(first).not.toHaveBeenCalled()
  expect(second).toHaveBeenCalledOnce()
  await expect(firstStarted).resolves.toBeDefined()
  await expect(secondStarted).resolves.toBeDefined()
})

test('a navigation arriving after the callback ran starts its own transition', async () => {
  const stub = stubViewTransitions()
  restore = stub.restore

  const viewTransitions = createViewTransitions()

  viewTransitions.start(() => {}, [])
  await stub.transitions[0].run()
  viewTransitions.start(() => {}, [])

  expect(stub.transitions).toHaveLength(2)
})

test('a skipped transition does not surface as an unhandled rejection', async () => {
  const stub = stubViewTransitions()
  restore = stub.restore

  createViewTransitions().start(() => {}, [])

  stub.transitions[0].skip()

  await flushPromises()
})

test('an update that throws rejects the navigation', async () => {
  const stub = stubViewTransitions()
  restore = stub.restore

  const started = createViewTransitions().start(() => {
    throw new Error('commit failed')
  }, [])

  await stub.transitions[0].run()

  await expect(started).rejects.toThrow('commit failed')
})

test('passes types when the browser understands them', async () => {
  const stub = stubViewTransitions({ types: true })
  restore = stub.restore

  createViewTransitions().start(() => {}, ['slide'])

  expect(stub.transitions[0].types).toEqual(['slide'])
})

test('leaves types out when the browser does not understand them', async () => {
  const stub = stubViewTransitions({ types: false })
  restore = stub.restore

  createViewTransitions().start(() => {}, ['slide'])

  expect(stub.transitions[0].types).toBeUndefined()
})
