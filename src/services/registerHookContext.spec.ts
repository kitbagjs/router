import { expect, test, vi } from 'vitest'
import { createHook } from '@/services/createHook'
import { createRoute } from '@/services/createRoute'
import { createRouter } from '@/services/createRouter'
import { createRejection } from '@/services/createRejection'
import { DuplicateNamesError } from '@/errors/duplicateNamesError'
import { UnreachableRouteError } from '@/errors/unreachableRouteError'

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
  const remove = registration === 'route'
    ? source.onBeforeRouteEnter(hook)
    : router.onBeforeRouteEnter(hook)

  await router.push('source', { id: 'redirect' })
  expect(router.route.name).toBe('target')
  expect(router.route.href).toBe('/app/target')

  await router.push('source', { id: 'denied' })
  expect(rejected).toHaveBeenCalledWith('Denied', expect.anything())

  remove()
  await router.push('/app/target')
  expect(router.route.name).toBe('target')
})

test('inherited hook context reaches existing and newly created routers', async () => {
  const parent = createRoute({ path: '/' })
  const source = createRoute({ parent, name: 'source' })
  const fallback = createRoute({ name: 'fallback', path: '/fallback' })
  const target = createRoute({ name: 'target', path: '/target', context: [fallback] })
  const first = createRouter([source], { base: '/first', initialUrl: '/first' })

  const remove = parent.onAfterRouteEnter(createHook({ context: [target], hook: () => {} }))
  const extra = createRoute({ name: 'extra', path: '/extra' })
  target.onAfterRouteEnter(createHook({ context: [extra], hook: () => {} }))
  const second = createRouter([source], { base: '/second', initialUrl: '/second', isGlobalRouter: false })
  remove()

  await first.start()
  await second.start()
  await first.push('/first/fallback')
  await second.push('/second/extra')
  expect(first.route.name).toBe('fallback')
  expect(second.route.name).toBe('extra')
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
