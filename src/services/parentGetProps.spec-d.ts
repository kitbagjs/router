import { expectTypeOf, test } from 'vitest'
import { defineComponent, FunctionalComponent } from 'vue'
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

test('optional components and throwing getters preserve getter presence', () => {
  const empty = createView({ component })
  const explicitEmpty = createView({ component, props: undefined })
  const reusable = createView({
    component,
    props: () => {
      throw new Error('failed')
    },
  })
  const parent = createRoute({ path: '/parent' }).addView(component)
    .addView(component, { name: 'optional', props: () => ({ value: 'parent' }) })
    .addView(Page, {
      name: 'throwing',
      props: () => {
        throw new Error('failed')
      },
    })
    .addView(component, { name: 'undefined', props: undefined })
    .addView(empty, { name: 'empty' })
    .addView(explicitEmpty, { name: 'explicitEmpty' })
    .addView(reusable, { name: 'reusable' })

  createRoute({ parent, path: '/child' }).addView(component, {
    props: (_route, { parent }) => {
      expectTypeOf(parent.getProps('optional')).toEqualTypeOf<Promise<{ value: string }>>()
      expectTypeOf(parent.getProps('throwing')).toEqualTypeOf<Promise<never>>()
      expectTypeOf(parent.getProps('reusable')).toEqualTypeOf<Promise<never>>()
      // @ts-expect-error the default view has no getter
      parent.getProps()
      // @ts-expect-error the reusable view has no getter
      parent.getProps('empty')
      // @ts-expect-error undefined is not a getter
      parent.getProps('undefined')
      // @ts-expect-error the reusable view has no getter
      parent.getProps('explicitEmpty')
      return {}
    },
  })
})

test('a getter returning undefined remains readable', () => {
  const page: FunctionalComponent<unknown> = () => null
  const view = createView({ component: page, props: () => undefined })
  const parent = createRoute({ path: '/parent' })
    .addView(page, { props: () => undefined })
    .addView(view, { name: 'reusable' })

  createRoute({ parent, path: '/child' }).addView(component, {
    props: (_route, { parent }) => {
      expectTypeOf(parent.getProps()).toEqualTypeOf<Promise<undefined>>()
      expectTypeOf(parent.getProps('reusable')).toEqualTypeOf<Promise<undefined>>()
      return {}
    },
  })
})
