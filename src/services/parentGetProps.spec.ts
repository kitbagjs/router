import { expect, test } from 'vitest'
import { defineComponent } from 'vue'
import { createRoute } from '@/services/createRoute'
import { createView } from '@/services/createView'
import { createResolvedRoute } from '@/services/createResolvedRoute'
import { createRouterNavigation } from '@/services/createRouterNavigation'
import { getComputations } from '@/services/getComputations'
import { component } from '@/utilities/testHelpers'

const Page = defineComponent((props: { value: string }) => () => props.value)

test('parent.getProps selects default and named getters', async () => {
  const initial = createRoute({ path: '/parent' }).addView(Page, { props: () => ({ value: 'first' }) })
  const parent = initial.addView(Page, { name: 'later', props: () => ({ value: 'later' }) }).addView(component, { name: 'empty' })
  const child = createRoute({ parent, path: '/child' }).addView(component, {
    props: async (_route, { parent }) => ({
      implicit: (await parent.getProps()).value,
      explicit: (await parent.getProps('default')).value,
      named: (await parent.getProps('later')).value,
    }),
  })
  const resolved = createResolvedRoute(child)
  const navigation = createRouterNavigation()

  navigation.commit({ to: resolved, from: null })

  await expect(navigation.getProps(child.id, 'default', resolved)).resolves.toEqual({
    kind: 'value',
    value: { implicit: 'first', explicit: 'first', named: 'later' },
  })
  navigation.stop()
})

test('a staged child loader can await a reusable parent view', async () => {
  const view = createView({ component: Page, props: async () => ({ value: 'parent' }) })
  const parent = createRoute({ path: '/parent' }).addView(view, { name: 'summary' })
  const child = createRoute({ parent, path: '/child' }).addLoader(async (_route, { parent }) => {
    return (await parent.getProps('summary')).value
  })
  const resolved = createResolvedRoute(child)
  const navigation = createRouterNavigation()

  await Promise.all(navigation.staged().compute(resolved, getComputations(resolved)))
  navigation.commit({ to: resolved, from: null })

  expect(navigation.getValues(resolved)).toContainEqual({ kind: 'loader', depth: 1, name: 'default', value: 'parent' })
  navigation.stop()
})

test('parent.getProps rejects absent getters and views outside the immediate parent', async () => {
  const grandparent = createRoute({ path: '/grandparent' }).addView(Page, { name: 'ancestor', props: () => ({ value: 'ancestor' }) })
  const parent = createRoute({ parent: grandparent, path: '/parent' })
    .addView(Page, { props: () => ({ value: 'parent' }) })
    .addView(component, { name: 'empty' })
  const child = createRoute({ parent, path: '/child' }).addView(component, {
    props: async (_route, { parent }) => {
      for (const name of ['empty', 'ancestor', 'missing']) {
        expect(() => Reflect.apply(parent.getProps, undefined, [name])).toThrow(TypeError)
      }
      return { value: (await parent.getProps()).value }
    },
  })
  const resolved = createResolvedRoute(child)
  const navigation = createRouterNavigation()

  navigation.commit({ to: resolved, from: null })

  await expect(navigation.getProps(child.id, 'default', resolved)).resolves.toEqual({ kind: 'value', value: { value: 'parent' } })
  navigation.stop()
})

test('parent.getProps preserves getter failures', async () => {
  const error = new Error('props failed')
  const parent = createRoute({ path: '/parent' }).addView(Page, {
    props: (): { value: string } => {
      throw error
    },
  })
  const child = createRoute({ parent, path: '/child' }).addView(component, {
    props: async (_route, { parent }) => {
      await parent.getProps()
      return {}
    },
  })
  const resolved = createResolvedRoute(child)
  const navigation = createRouterNavigation()

  navigation.commit({ to: resolved, from: null })

  await expect(navigation.getProps(child.id, 'default', resolved)).resolves.toEqual({ kind: 'error', error })
  navigation.stop()
})
