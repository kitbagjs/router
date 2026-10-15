import { expect, test, vi } from 'vitest'
import { createLoader } from '@/services/createLoader'
import { createRoute } from '@/services/createRoute'
import { createRouter } from '@/services/createRouter'
import { createRejection } from '@/services/createRejection'

test('one definition loads independently for multiple routes', async () => {
  const loader = createLoader({
    load: async (route) => `${route.name}-${route.params.id}`,
  })
  const first = createRoute({ name: 'first', path: '/first/[id]' }).addLoader(loader)
  const second = createRoute({ name: 'second', path: '/second/[id]' }).addLoader(loader)
  const router = createRouter([first, second], { initialUrl: '/first/1' })

  await router.start()
  await expect(router.route.data).resolves.toBe('first-1')
  await router.push('second', { id: '2' })
  await expect(router.route.data).resolves.toBe('second-2')
})

test('attachment overrides loader defaults without changing other attachments', () => {
  const transformer = { stringify: String, parse: Number }
  const overrideTransformer = { stringify: JSON.stringify, parse: JSON.parse }
  const loader = createLoader({ load: () => 1, prefetch: 'eager', transformer })
  const overridden = createRoute({ path: '/' }).addLoader(loader, {
    prefetch: false,
    transformer: overrideTransformer,
  })
  const defaults = createRoute({ path: '/' }).addLoader(loader)

  expect(overridden.matches[0].loaders.default).toMatchObject({ prefetch: false, transformer: overrideTransformer })
  expect(defaults.matches[0].loaders.default).toMatchObject({ prefetch: 'eager', transformer })
})

test('loader context registers navigation targets and rejections through chained attachments', async () => {
  const denied = createRejection({ type: 'Denied' })
  const rejectLoader = createLoader({ context: [denied], load: (_params, { reject }) => reject('Denied') })
  const target = createRoute({ name: 'target', path: '/target' }).addLoader(rejectLoader)
  const redirectLoader = createLoader({ context: [target], load: (_params, { push }) => push('target') })
  const route = createRoute({ name: 'source', path: '/' }).addLoader(redirectLoader)
    .addLoader(() => 1, { name: 'other' })
  const router = createRouter([route], { initialUrl: '/' })
  const onRejection = vi.fn()
  router.onRejection(onRejection)

  await router.start()
  await vi.waitFor(() => expect(onRejection).toHaveBeenCalledWith('Denied', expect.anything()))
  expect(router.route.name).toBe('target')
})
