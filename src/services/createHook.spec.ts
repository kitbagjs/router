import { expect, test, vi } from 'vitest'
import { createHook } from '@/services/createHook'
import { createRoute } from '@/services/createRoute'
import { createRouter } from '@/services/createRouter'
import { createRejection } from '@/services/createRejection'
import { createRouterHooks } from '@/services/createRouterHooks'
import { createExternalRoute } from '@/services/createExternalRoute'
import { RouteContext } from '@/types/routeContext'
import { component } from '@/utilities/testHelpers'
import { createResolvedRoute } from '@/services/createResolvedRoute'

test('abort is available before navigation and absent after navigation', async () => {
  const hook = createHook({
    hook: (route, context) => {
      if (context.kind === 'before' && route?.name === 'blocked') {
        context.abort()
      }
      if (context.kind === 'after') {
        expect('abort' in context).toBe(false)
      }
    },
  })
  const home = createRoute({ name: 'home', path: '/' })
  const blocked = createRoute({ name: 'blocked', path: '/blocked' })
  home.onAfterRouteEnter(hook)
  blocked.onBeforeRouteEnter(hook)
  const router = createRouter([home, blocked], { initialUrl: '/' })

  await router.start()
  await router.push('blocked')
  expect(router.route.name).toBe('home')
})

test('leave hooks handle a null destination without exposing update', async () => {
  const observed: string[] = []
  const hook = createHook({
    hook: (route, context) => {
      expect(route).toBeNull()
      expect(context.update).toBeUndefined()
      observed.push(context.kind)
    },
  })
  const hooks = createRouterHooks({ redirectStatus: 302 })
  hooks.onBeforeRouteLeave(hook)
  hooks.onAfterRouteLeave(hook)
  const navigation = {
    to: null,
    from: createResolvedRoute(createRoute({ name: 'home', path: '/' })),
    signal: new AbortController().signal,
  }

  await hooks.runBeforeRouteHooks(navigation)
  await hooks.runAfterRouteHooks(navigation)
  expect(observed).toEqual(['before', 'after'])
})

test('one hook runs before and after enter, update, and leave', async () => {
  const observed: string[] = []
  const hook = createHook({
    hook: (route, context) => {
      observed.push(`${context.kind}:${route?.name}:${route?.params.id}`)
    },
  })
  const first = createRoute({ name: 'first', path: '/first/[id]' })
  const second = createRoute({ name: 'second', path: '/second/[id]' })
  first.onBeforeRouteEnter(hook)
  first.onBeforeRouteUpdate(hook)
  second.onBeforeRouteEnter(hook)
  first.onBeforeRouteLeave(hook)
  first.onAfterRouteEnter(hook)
  first.onAfterRouteUpdate(hook)
  first.onAfterRouteLeave(hook)
  second.onAfterRouteEnter(hook)
  const router = createRouter([first, second], { initialUrl: '/first/1' })

  await router.start()
  await router.push('first', { id: '2' })
  await router.push('second', { id: '3' })
  expect(observed).toEqual([
    'before:first:1',
    'after:first:1',
    'before:first:2',
    'after:first:2',
    'before:second:3',
    'before:second:3',
    'after:second:3',
    'after:second:3',
  ])
})

test('declared context registers routes and rejections before router creation', async () => {
  const target = createRoute({ name: 'target', path: '/target' })
  const denied = createRejection({ type: 'Denied' })
  const hook = createHook({
    context: [target, denied],
    hook: (route, { push, reject }) => {
      if (route?.params.id === 'redirect') {
        return push('target')
      }
      reject('Denied')
    },
  })
  const source = createRoute({ name: 'source', path: '/source/[id]' })
  source.onBeforeRouteEnter(hook)
  expect(source.context).toEqual([target, denied])
  const router = createRouter([source], { initialUrl: '/source/redirect' })
  const rejected = vi.fn()
  router.onRejection(rejected)

  await router.start()
  expect(router.route.name).toBe('target')
  await router.push('source', { id: 'denied' })
  expect(rejected).toHaveBeenCalledWith('Denied', expect.anything())
})

test('reusable hooks retain the registration removal behavior', async () => {
  const callback = vi.fn()
  const route = createRoute({ name: 'home', path: '/' })
  const remove = route.onBeforeRouteEnter(createHook({ hook: callback }))
  remove()
  await createRouter([route], { initialUrl: '/' }).start()
  expect(callback).not.toHaveBeenCalled()
})

test.each([
  { name: 'internal', createParent: (context: RouteContext[]) => createRoute({ name: 'parent', path: '/parent', context }) },
  { name: 'external', createParent: (context: RouteContext[]) => createExternalRoute({ name: 'parent', host: 'https://example.com', path: '/parent', context }) },
])('$name route context includes hooks added after children and copies are created', ({ createParent }) => {
  const shared = createRoute({ name: 'shared', path: '/shared' })
  const own = createRoute({ name: 'own', path: '/own' })
  const target = createRoute({ name: 'target', path: '/target' })
  const parent = createParent([shared])
  const child = createRoute({ parent, name: 'child', path: '/child', context: [own] })
    .addView(component)
    .addAlias({ path: '/alias' })

  parent.onBeforeRouteEnter(createHook({ context: [target], hook: () => {} }))

  expect(parent.context).toEqual([shared, target])
  expect(child.context).toEqual([shared, own, target])
})
