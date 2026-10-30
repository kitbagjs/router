import { expectTypeOf, test } from 'vitest'
import { defineComponent } from 'vue'
import { createRoute } from '@/services/createRoute'
import { createView } from '@/services/createView'
import { component } from '@/utilities/testHelpers'

const Page = defineComponent((props: { value: string }) => () => props.value)

test('parent.getProps accepts views with getters and rejects views without getters', () => {
  const initial = createRoute({ path: '/parent' }).addView(Page, { props: () => ({ value: 'first' }) })
  const parent = initial.addView(Page, { name: 'later', props: () => ({ value: 'later' }) }).addView(component, { name: 'empty' })
  createRoute({ parent, path: '/child' }).addView(component, {
    props: (_route, { parent }) => {
      expectTypeOf(parent.getProps()).toExtend<Promise<{ value: string }>>()
      expectTypeOf(parent.getProps('default')).toEqualTypeOf<Promise<{ value: string }>>()
      expectTypeOf(parent.getProps('later')).toExtend<Promise<{ value: string }>>()
      // @ts-expect-error a view without a getter has no props promise
      parent.getProps('empty')
      // @ts-expect-error unknown views have no props promise
      parent.getProps('missing')
      return {}
    },
  })
})

test('parent.getProps reads inline and reusable view getters', () => {
  const reusable = createView({ component: Page, props: async () => ({ value: 'named' }) })
  const parent = createRoute({ path: '/parent' }).addView(Page, {
    props: () => ({ value: 'default' }),
  })
    .addView(reusable, { name: 'named' })
  createRoute({ parent, path: '/child' }).addLoader((_route, { parent }) => {
    expectTypeOf(parent.getProps()).toExtend<Promise<{ value: string }>>()
    expectTypeOf(parent.getProps('named')).toEqualTypeOf<Promise<{ value: string }>>()
    // @ts-expect-error only declared views can be selected
    parent.getProps('missing')
    return 'child'
  })
})

test('named-only parents require a name and exclude ancestor views', () => {
  const grandparent = createRoute({ path: '/grandparent' }).addView(Page, { props: () => ({ value: 'ancestor' }) })
  const parent = createRoute({ parent: grandparent, path: '/parent' }).addView(Page, { name: 'named', props: () => ({ value: 'parent' }) })
  createRoute({ parent, path: '/child' }).addView(component, {
    props: (_route, { parent }) => {
      expectTypeOf(parent.getProps('named')).toEqualTypeOf<Promise<{ value: string }>>()
      // @ts-expect-error the immediate parent has no default getter
      parent.getProps()
      // @ts-expect-error ancestor views are outside the immediate parent
      parent.getProps('default')
      return {}
    },
  })
})

test('parents without getters accept no names', () => {
  const empty = createRoute({ path: '/parent' }).addView(component)
  createRoute({ parent: empty, path: '/child' }).addView(component, {
    props: (_route, { parent }) => {
      // @ts-expect-error a view without a getter has no default promise
      parent.getProps()
      // @ts-expect-error a view without a getter has no named promises
      parent.getProps('default')
      return {}
    },
  })
})
