import { expect, test, vi } from 'vitest'
import { createHook } from '@/services/createHook'
import { createRoute } from '@/services/createRoute'
import { createRouter } from '@/services/createRouter'
import { createRejection } from '@/services/createRejection'

test('one hook runs on enter and update across multiple routes', async () => {
  const observed: { name: string, id: unknown }[] = []
  const hook = createHook({
    hook: (route) => {
      observed.push({ name: route.name, id: route.params.id })
    },
  })
  const first = createRoute({ name: 'first', path: '/first/[id]' })
  const second = createRoute({ name: 'second', path: '/second/[id]' })
  first.onBeforeRouteEnter(hook)
  first.onBeforeRouteUpdate(hook)
  second.onBeforeRouteEnter(hook)
  const router = createRouter([first, second], { initialUrl: '/first/1' })

  await router.start()
  await router.push('first', { id: '2' })
  await router.push('second', { id: '3' })
  expect(observed).toEqual([{ name: 'first', id: '1' }, { name: 'first', id: '2' }, { name: 'second', id: '3' }])
})

test('declared context registers routes and rejections before router creation', async () => {
  const target = createRoute({ name: 'target', path: '/target' })
  const denied = createRejection({ type: 'Denied' })
  const hook = createHook({
    context: [target, denied],
    hook: (route, { push, reject }) => {
      if (route.params.id === 'redirect') {
        return push('target')
      }
      reject('Denied')
    },
  })
  const source = createRoute({ name: 'source', path: '/source/[id]' })
  source.onBeforeRouteEnter(hook)
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
