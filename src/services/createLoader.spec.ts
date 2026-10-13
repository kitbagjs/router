import { expect, test, vi } from 'vitest'
import { createLoader } from '@/services/createLoader'
import { createRoute } from '@/services/createRoute'
import { createRouter } from '@/services/createRouter'
import { createRejection } from '@/services/createRejection'
import { LoaderNameConflict } from '@/errors/loaderNameConflict'

test('one definition loads independently for routes with direct and mapped params', async () => {
  const load = vi.fn(({ id }: { id: string }, { signal }: { signal: AbortSignal }) => {
    expect(signal).toBeInstanceOf(AbortSignal)

    return `user-${id}`
  })
  const loader = createLoader({ load })
  const first = createRoute({ name: 'first', path: '/first/[id]' }).addLoader(loader)
  const second = createRoute({ name: 'second', path: '/second/[userId]' }).addLoader(loader, {
    params: (route) => ({ id: route.params.userId }),
  })
  const router = createRouter([first, second], { initialUrl: '/first/1' })

  expect(load).not.toHaveBeenCalled()
  await router.start()
  await expect(router.route.data).resolves.toBe('user-1')
  await router.push('second', { userId: '2' })
  await expect(router.route.data).resolves.toBe('user-2')
  expect(load).toHaveBeenCalledTimes(2)
})

test('attachment preserves defaults, overrides, immutability, and ancestor conflicts', () => {
  const transformer = { stringify: String, parse: Number }
  const loader = createLoader({ load: () => 1, prefetch: 'eager', transformer })
  const original = createRoute({ name: 'original', path: '/' })
  const route = original.addLoader(loader)
  const other = original.addLoader(loader, { name: 'count', prefetch: false })

  expect(original.matches[0].loaders).toStrictEqual({})
  expect(route.matches[0].loaders.default).toMatchObject({ prefetch: 'eager', transformer })
  expect(other.matches[0].loaders.count).toMatchObject({ prefetch: false, transformer })
  expect(loader.prefetch).toBe('eager')
  expect(() => createRoute({ parent: route, path: '/child' }).addLoader(loader)).toThrow(LoaderNameConflict)
})

test('loader context registers navigation targets and rejections through chained attachments', async () => {
  const denied = createRejection({ type: 'Denied' })
  const rejectLoader = createLoader({ context: [denied], load: (_params, { reject }) => reject('Denied') })
  const target = createRoute({ name: 'target', path: '/target' }).addLoader(rejectLoader)
  const redirectLoader = createLoader({ context: [target], load: (_params, { push }) => push('target') })
  const original = createRoute({ name: 'original', path: '/' })
  const route = original.addLoader(redirectLoader).addLoader(() => 1, { name: 'other' })
  const router = createRouter([route], { initialUrl: '/' })
  const onRejection = vi.fn()
  router.onRejection(onRejection)

  expect(original.context).toStrictEqual([])
  expect(route.context).toStrictEqual([target])
  await router.start()
  await vi.waitFor(() => expect(onRejection).toHaveBeenCalledWith('Denied', expect.anything()))
  expect(router.route.name).toBe('target')
})
