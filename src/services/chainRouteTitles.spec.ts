import { expect, test } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { createResolvedRoute } from '@/services/createResolvedRoute'
import { component } from '@/utilities/testHelpers'

test('setTitle returns its receiver and applies immediately', async () => {
  const route = createRoute({ name: 'home', path: '/' })

  expect(route.setTitle(() => 'Home')).toBe(route)
  expect(await createResolvedRoute(route).getTitle()).toBe('Home')

  route.setTitle(() => 'Updated')
  expect(await createResolvedRoute(route).getTitle()).toBe('Updated')
})

test('title callbacks survive chaining and retain parent title access', async () => {
  const parent = createRoute({ path: '/parent' }).setTitle(() => 'Parent')
  const child = createRoute({ parent, name: 'child', path: '/child' })
    .setTitle(async (_to, { getParentTitle }) => `${await getParentTitle()} - Child`)
    .addView(component)
    .addLoader(() => 42)
    .onBeforeRouteEnter(() => {})

  expect(await createResolvedRoute(child).getTitle()).toBe('Parent - Child')
  expect(child.setTitle(() => 'New title')).toBe(child)
  expect(await createResolvedRoute(child).getTitle()).toBe('New title')
})
