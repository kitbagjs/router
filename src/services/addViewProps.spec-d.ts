import { expectTypeOf, test } from 'vitest'
import { defineComponent } from 'vue'
import { createRoute } from '@/services/createRoute'
import { AddViewPropsGetter } from '@/types/addView'
import { component } from '@/utilities/testHelpers'

const Page = defineComponent((props: { value: string }) => () => props.value)

test('an explicitly typed default getter exposes its props to child callbacks', () => {
  const route = createRoute({ path: '/parent' })
  const props: AddViewPropsGetter<typeof route, typeof Page> = () => ({ value: 'parent' })
  const parent = route.addView(Page, { props })

  createRoute({ parent, path: '/child' }).addView(component, {
    props: (_route, { parent }) => {
      expectTypeOf(parent.props).toExtend<Promise<{ value: string }>>()
      return {}
    },
  })
})

test('an explicitly typed named getter stays present alongside a view without props', () => {
  const route = createRoute({ path: '/parent' })
  const props: AddViewPropsGetter<typeof route, typeof Page> = () => ({ value: 'parent' })
  const parent = route.addView(Page, { name: 'named', props }).addView(component, { name: 'empty' })

  createRoute({ parent, path: '/child' }).addView(component, {
    props: (_route, { parent }) => {
      expectTypeOf(parent.props.named).toExtend<Promise<{ value: string }>>()
      // @ts-expect-error a view without a getter has no props promise
      expectTypeOf(parent.props.empty)
      return {}
    },
  })
})

test('a getter annotated to return a value or promise exposes its props to child callbacks', () => {
  const parent = createRoute({ path: '/parent' }).addView(Page, {
    props: (_route, _context): { value: string } | Promise<{ value: string }> => ({ value: 'parent' }),
  })

  createRoute({ parent, path: '/child' }).addView(component, {
    props: (_route, { parent }) => {
      expectTypeOf(parent.props).toExtend<Promise<{ value: string }>>()
      return {}
    },
  })
})

test('a getter that always throws exposes a rejected props promise to child callbacks', () => {
  const parent = createRoute({ path: '/parent' }).addView(Page, {
    props: () => {
      throw new Error('failed')
    },
  })

  createRoute({ parent, path: '/child' }).addView(component, {
    props: (_route, { parent }) => {
      expectTypeOf(parent.props).toEqualTypeOf<Promise<never>>()
      return {}
    },
  })
})
