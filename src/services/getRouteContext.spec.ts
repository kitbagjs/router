import { expect, test } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { createExternalRoute } from '@/services/createExternalRoute'
import { getRouteContext } from '@/services/getRouteContext'
import { component } from '@/utilities/testHelpers'

test('collects declared context from internal and external routes', () => {
  const target = createRoute({ name: 'target', path: '/target' })
  const routes = [
    createRoute({ name: 'source', path: '/', context: [target] }),
    createExternalRoute({ name: 'external', host: 'https://example.com', context: [target] }),
  ]

  for (const route of routes) {
    expect(getRouteContext(route)).toEqual([target])
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

  expect(getRouteContext(child)).toEqual([shared, own])
})
