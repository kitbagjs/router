import echo from '@/components/echo'
import { createRoute } from '@/services/createRoute'
import { createRouter } from '@/services/createRouter'
import { component } from '@/utilities'
import { expect, test, vi } from 'vitest'
import { createApp, inject } from 'vue'

test('hooks are run with the correct context', async () => {
  const beforeRouteHook = vi.fn()
  const afterRouteHook = vi.fn()
  const beforeGlobalHook = vi.fn()
  const afterGlobalHook = vi.fn()

  const route = createRoute({
    path: '/',
    name: 'route',
    component: echo,
  }, () => ({ value: 'hello' }))

  route.onBeforeRouteEnter(() => {
    const value = inject('global')

    beforeRouteHook(value)
  })

  route.onAfterRouteEnter(() => {
    const value = inject('global')

    afterRouteHook(value)
  })

  const router = createRouter([route], {
    initialUrl: '/',
  })

  router.onBeforeRouteEnter(() => {
    const value = inject('global')

    beforeGlobalHook(value)
  })

  router.onAfterRouteEnter(() => {
    const value = inject('global')

    afterGlobalHook(value)
  })

  const app = createApp(component)

  app.provide('global', 'hello world')
  app.use(router)

  await router.start()

  expect(beforeRouteHook).toHaveBeenCalledWith('hello world')
  expect(afterRouteHook).toHaveBeenCalledWith('hello world')
  expect(beforeGlobalHook).toHaveBeenCalledWith('hello world')
  expect(afterGlobalHook).toHaveBeenCalledWith('hello world')
})
