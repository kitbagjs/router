import { expect, test, vi } from 'vitest'
import { createHook } from '@/services/createHook'
import { createRoute } from '@/services/createRoute'
import { createRouter } from '@/services/createRouter'
import { createRejection } from '@/services/createRejection'
import { DuplicateNamesError } from '@/errors/duplicateNamesError'
import { UnreachableRouteError } from '@/errors/unreachableRouteError'
import { getHooks } from '@/types/hooks'

test.each(['route', 'router'] as const)('late %s hooks register navigation and rejection targets', async (registration) => {
  const home = createRoute({ name: 'home', path: '/' })
  const source = createRoute({ name: 'source', path: '/source/[id]' })
  const target = createRoute({ name: 'target', path: '/target' })
  const denied = createRejection({ type: 'Denied' })
  const router = createRouter([home, source], { base: '/app', initialUrl: '/app' })
  const rejected = vi.fn()
  router.onRejection(rejected)
  await router.start()

  const hook = createHook({
    context: [target, denied],
    hook: (to, { push, reject }) => {
      if (to?.name !== 'source') {
        return
      }
      if (to.params.id === 'redirect') {
        return push('target')
      }
      reject('Denied')
    },
  })
  const controller = new AbortController()

  if (registration === 'route') {
    source.onBeforeRouteEnter(hook, { signal: controller.signal })
  } else {
    router.onBeforeRouteEnter(hook, { signal: controller.signal })
  }

  await router.push('source', { id: 'redirect' })
  expect(router.route.name).toBe('target')
  expect(router.route.href).toBe('/app/target')

  await router.push('source', { id: 'denied' })
  expect(rejected).toHaveBeenCalledWith('Denied', expect.anything())

  controller.abort()
  await router.push('/app/target')
  expect(router.route.name).toBe('target')
})

test('inherited hook context reaches existing and newly created routers', async () => {
  const parent = createRoute({ path: '/' })
  const source = createRoute({ parent, name: 'source' })
  const fallback = createRoute({ name: 'fallback', path: '/fallback' })
  const target = createRoute({ name: 'target', path: '/target', context: [fallback] })
  const first = createRouter([source], { base: '/first', initialUrl: '/first' })

  const controller = new AbortController()
  parent.onAfterRouteEnter(createHook({ context: [target], hook: () => {} }), { signal: controller.signal })
  const extra = createRoute({ name: 'extra', path: '/extra' })
  target.onAfterRouteEnter(createHook({ context: [extra], hook: () => {} }))
  const second = createRouter([source], { base: '/second', initialUrl: '/second', isGlobalRouter: false })
  controller.abort()

  await first.start()
  await second.start()
  await first.push('/first/fallback')
  await second.push('/second/extra')
  expect(first.route.name).toBe('fallback')
  expect(second.route.name).toBe('extra')
})

test('stopping a router removes its subscriptions without affecting another router', () => {
  const source = createRoute({ name: 'source', path: '/' })
  const target = createRoute({ name: 'target', path: '/target' })
  const first = createRouter([source], { initialUrl: '/' })
  const second = createRouter([source], { initialUrl: '/', isGlobalRouter: false })
  source.onAfterRouteEnter(createHook({ context: [target], hook: () => {} }))
  const stores = [...getHooks(source), ...getHooks(target)]

  expect(stores.map((store) => store.onHookAdded.size)).toEqual([2, 2])
  first.stop()
  first.stop()

  const extra = createRoute({ name: 'extra', path: '/extra' })
  target.onAfterRouteEnter(createHook({ context: [extra], hook: () => {} }))

  expect(first.find('/extra')).toBeUndefined()
  expect(second.find('/extra')?.name).toBe('extra')
  second.stop()
  expect([...stores, ...getHooks(extra)].map((store) => store.onHookAdded.size)).toEqual([0, 0, 0])
})

test.each([
  { invalid: createRoute({ name: 'home', path: '/duplicate' }), error: DuplicateNamesError },
  { invalid: createRoute({ name: 'invalid', path: 'relative' }), error: UnreachableRouteError },
])('invalid context rejects hook registration without partially adding targets: $error.name', async ({ invalid, error }) => {
  const home = createRoute({ name: 'home', path: '/' })
  const target = createRoute({ name: 'target', path: '/target' })
  const router = createRouter([home], { initialUrl: '/' })
  const callback = vi.fn()
  const hook = createHook({ context: [target, invalid], hook: callback })

  expect(() => home.onBeforeRouteEnter(hook)).toThrow(error)
  expect(home.context).toEqual([])
  await router.start()
  await router.push('/target')
  expect(router.route.name).not.toBe('target')
  expect(callback).not.toHaveBeenCalled()
})
