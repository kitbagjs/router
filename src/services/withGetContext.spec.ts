import { assert, expect, test } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { createExternalRoute } from '@/services/createExternalRoute'
import { isRoute } from '@/types/route'
import { component } from '@/utilities/testHelpers'

test('context callbacks can be destructured from internal and external routes', () => {
  const target = createRoute({ name: 'target', path: '/target' })
  const routes = [
    createRoute({ name: 'source', path: '/', context: [target] }),
    createExternalRoute({ name: 'external', host: 'https://example.com', context: [target] }),
  ]

  for (const route of routes) {
    assert(isRoute(route))
    const { getContext } = route
    expect(getContext()).toEqual([target])
  }
})

test('chained route copies collect their own inherited context', () => {
  const shared = createRoute({ name: 'shared', path: '/shared' })
  const own = createRoute({ name: 'own', path: '/own' })
  const parent = createRoute({ path: '/parent', context: [shared] })
  const child = createRoute({ parent, name: 'child', path: '/child', context: [own] })
    .addLoader(() => 1)
    .addView(component)
    .addAlias({ path: '/alias' })

  assert(isRoute(child))
  const { getContext } = child
  expect(getContext()).toEqual([shared, own])
})
