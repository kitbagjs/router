import { expect, test, vi } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { createResolvedRoute } from '@/services/createResolvedRoute'
import { createRouterNavigation } from '@/services/createRouterNavigation'
import { getComputations } from '@/services/getComputations'
import { component } from '@/utilities/testHelpers'

test('parent.getData selects default and named loaders independently of child loaders', async () => {
  const load = vi.fn(() => 'parent')
  const parent = createRoute({ path: '/parent' }).addLoader(load)
    .addLoader(() => 42, { name: 'count' })
  const child = createRoute({ parent, path: '/child' }).addLoader(() => 'child', { name: 'child' })
    .addView(component, {
      props: async (_route, { parent }) => ({
        implicit: await parent.getData(),
        explicit: await parent.getData('default'),
        named: await parent.getData('count'),
      }),
    })
  const resolved = createResolvedRoute(child)
  const navigation = createRouterNavigation()

  navigation.commit({ to: resolved, from: null })

  await expect(navigation.getProps(child.id, 'default', resolved)).resolves.toEqual({
    kind: 'value',
    value: { implicit: 'parent', explicit: 'parent', named: 42 },
  })
  expect(load).toHaveBeenCalledOnce()
  navigation.stop()
})

test('a child loader reads an inherited default loader from the staged store', async () => {
  const grandparent = createRoute({ path: '/grandparent' }).addLoader(() => 'parent')
  const parent = createRoute({ parent: grandparent, path: '/parent' })
  const child = createRoute({ parent, path: '/child' })
    .addLoader(async (_route, { parent }) => `child of ${await parent.getData()}`, { name: 'child' })
  const resolved = createResolvedRoute(child)
  const navigation = createRouterNavigation()

  await Promise.all(navigation.staged().compute(resolved, getComputations(resolved)))
  navigation.commit({ to: resolved, from: null })

  expect(navigation.getValues(resolved)).toContainEqual({ kind: 'loader', depth: 2, name: 'child', value: 'child of parent' })
  navigation.stop()
})

test('parent.getData includes ancestor loaders and excludes child loaders', async () => {
  const grandparent = createRoute({ path: '/grandparent' }).addLoader(() => 'ancestor', { name: 'ancestor' })
  const parent = createRoute({ parent: grandparent, path: '/parent' }).addLoader(() => 'parent')
  const child = createRoute({ parent, path: '/child' }).addLoader(() => 'child', { name: 'child' })
    .addView(component, {
      props: async (_route, { parent }) => {
        for (const name of ['child', 'missing']) {
          expect(() => Reflect.apply(parent.getData, undefined, [name])).toThrow(TypeError)
        }
        return { value: await parent.getData(), ancestor: await parent.getData('ancestor') }
      },
    })
  const resolved = createResolvedRoute(child)
  const navigation = createRouterNavigation()

  navigation.commit({ to: resolved, from: null })

  await expect(navigation.getProps(child.id, 'default', resolved)).resolves.toEqual({ kind: 'value', value: { value: 'parent', ancestor: 'ancestor' } })
  navigation.stop()
})

test('parent.getData preserves loader failures', async () => {
  const error = new Error('parent failed')
  const parent = createRoute({ path: '/parent' }).addLoader((): string => {
    throw error
  })
  const child = createRoute({ parent, path: '/child' }).addView(component, {
    props: async (_route, { parent }) => ({ value: await parent.getData() }),
  })
  const resolved = createResolvedRoute(child)
  const navigation = createRouterNavigation()

  navigation.commit({ to: resolved, from: null })

  await expect(navigation.getProps(child.id, 'default', resolved)).resolves.toEqual({ kind: 'error', error })
  navigation.stop()
})
