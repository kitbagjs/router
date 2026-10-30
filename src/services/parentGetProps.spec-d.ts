import { ViewsProps } from '@/types/routeViews'
import { expectTypeOf, test } from 'vitest'
import { defineComponent } from 'vue'
import { createRoute } from '@/services/createRoute'
import { createView } from '@/services/createView'
import { AddViewPropsGetter } from '@/types/addView'
import { component } from '@/utilities/testHelpers'

const Page = defineComponent((props: { value: string }) => () => props.value)

test('explicitly typed getters remain present in the parent props map', () => {
  const initial = createRoute({ path: '/parent' }).addView(Page, { props: () => ({ value: 'first' }) })
  const namedProps: AddViewPropsGetter<typeof initial, typeof Page> = () => ({ value: 'later' })
  const parent = initial.addView(Page, { name: 'later', props: namedProps }).addView(component, { name: 'empty' })
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

test('broadly annotated inline and reusable view getters keep their props types', () => {
  const reusable = createView({ component: Page, props: async () => ({ value: 'named' }) })
  const parent = createRoute({ path: '/parent' }).addView(Page, {
    props: (_route, _context): { value: string } | Promise<{ value: string }> => ({ value: 'default' }),
  })
    .addView(reusable, { name: 'named' })
  expectTypeOf<keyof ViewsProps<typeof parent['matches'][0]['views']>>().toEqualTypeOf<'default' | 'named'>()
  createRoute({ parent, path: '/child' }).addLoader((_route, { parent }) => {
    expectTypeOf(parent.getProps()).toExtend<Promise<{ value: string }>>()
    expectTypeOf(parent.getProps('named')).toEqualTypeOf<Promise<{ value: string }>>()
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

test('parents without getters accept no names, while throwing getters remain present', () => {
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
  const throwing = createRoute({ path: '/parent' }).addView(Page, {
    props: () => {
      throw new Error('failed')
    },
  })
  createRoute({ parent: throwing, path: '/child' }).addView(component, {
    props: (_route, { parent }) => {
      expectTypeOf(parent.getProps()).toEqualTypeOf<Promise<never>>()
      return {}
    },
  })
})
