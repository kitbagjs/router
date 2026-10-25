import { expect, test, vi } from 'vitest'
import { isView } from '@/types/view'
import { createView } from '@/services/createView'
import { createRoute } from '@/services/createRoute'
import { createResolvedRoute } from '@/services/createResolvedRoute'
import { createRouterNavigation } from '@/services/createRouterNavigation'
import { createRouter } from '@/services/createRouter'
import { component } from '@/utilities/testHelpers'
import { getComputations } from '@/services/getComputations'

test('one view computes props and loader data independently for multiple routes', async () => {
  const view = createView({
    component,
    props: async (route) => ({ name: route.name, id: route.params.id, data: await route.data }),
  })
  const first = createRoute({ name: 'first', path: '/first/[id]' }).addLoader(() => 'first data')
    .addView(view)
  const second = createRoute({ name: 'second', path: '/second/[id]' }).addLoader(() => 'second data')
    .addView(view, { name: 'sidebar' })

  for (const [route, name] of [[first, 'default'], [second, 'sidebar']] as const) {
    const resolved = createResolvedRoute(route, { id: '1' })
    const navigation = createRouterNavigation()
    const values = navigation.staged().compute(resolved, getComputations(resolved))
    await Promise.all(values)
    navigation.commit(resolved)
    expect(navigation.getProps(route.id, name, resolved)).toEqual({
      kind: 'value', value: { name: route.name, id: '1', data: `${route.name} data` },
    })
  }
})

test('view context registers targets and attachments preserve identity and defaults', async () => {
  const login = createRoute({ name: 'login', path: '/login' })
  const view = createView({
    component,
    context: [login],
    prefetch: 'eager',
    props: (_route, { push }) => {
      push('login')
      return { id: 1 }
    },
  })
  const defaults = createRoute({ name: 'defaults', path: '/' }).addView(view)
  const override = createRoute({ name: 'override', path: '/override' }).addView(view, { name: 'sidebar', prefetch: false })
  const router = createRouter([defaults, override], { initialUrl: '/' })

  await router.start()
  await vi.waitFor(() => expect(router.route.name).toBe('login'))
  expect(isView(defaults.matches[0].views.default)).toBe(true)
  expect(isView(override.matches[0].views.sidebar)).toBe(true)
  expect(defaults.matches[0].views.default.prefetch).toBe('eager')
  expect(override.matches[0].views.sidebar.prefetch).toBe(false)
})
