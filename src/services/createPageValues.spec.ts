import { expect, test, vi } from 'vitest'
import { createPageValues } from '@/services/createPageValues'
import { createRouteValueStore } from '@/services/createRouteValueStore'
import { createRoute } from '@/services/createRoute'
import { createResolvedRoute } from '@/services/createResolvedRoute'

test('committing prepared values reuses the loaders that produced them', async () => {
  const data = Promise.withResolvers<string>()
  const load = vi.fn(() => data.promise)
  const route = createResolvedRoute(createRoute({ name: 'route', path: '/' }).addLoader(load))
  const store = createRouteValueStore()
  const values = createPageValues(route, store)
  const prepared = values.prepare()

  data.resolve('prepared')
  await prepared.loaders

  const committed = values.commit()

  await committed.loaders
  expect(load).toHaveBeenCalledOnce()
  await expect(store.getData(route)).resolves.toBe('prepared')
})

test('disposed preparation cannot supply values to the next navigation', async () => {
  const data = Promise.withResolvers<string>()
  const signals: AbortSignal[] = []
  const load = vi.fn((_route, { signal }) => {
    signals.push(signal)

    return data.promise
  })
  const route = createResolvedRoute(createRoute({ name: 'route', path: '/' }).addLoader(load))
  const store = createRouteValueStore()
  const first = createPageValues(route, store)

  first.prepare()
  first.dispose()
  expect(signals[0].aborted).toBe(true)

  const next = createPageValues(route, store)
  const committed = next.commit()

  expect(load).toHaveBeenCalledTimes(2)
  expect(signals[1].aborted).toBe(false)
  data.resolve('fresh')
  await committed.loaders
  await expect(store.getData(route)).resolves.toBe('fresh')
})
