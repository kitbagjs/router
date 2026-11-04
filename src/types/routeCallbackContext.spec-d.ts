import { expectTypeOf, test } from 'vitest'
import { defineComponent } from 'vue'
import { createRoute } from '@/services/createRoute'
import { createView } from '@/services/createView'
import { component } from '@/utilities/testHelpers'

const Page = defineComponent((props: { value: string }) => () => props.value)

test('parent.getData returns the selected loader promise in views and loaders', () => {
  const parent = createRoute({ path: '/parent' }).addLoader(() => 'parent')
    .addLoader(() => 42, { name: 'count' })
  createRoute({ parent, path: '/child' })
    .addLoader((_route, { parent }) => {
      expectTypeOf(parent.getData()).toEqualTypeOf<Promise<string>>()
      expectTypeOf(parent.getData('default')).toEqualTypeOf<Promise<string>>()
      expectTypeOf(parent.getData('count')).toEqualTypeOf<Promise<number>>()
      return 'child'
    }, { name: 'child' })
    .addView(component, {
      props: (_route, { parent }) => {
        expectTypeOf(parent.getData()).toEqualTypeOf<Promise<string>>()
        // @ts-expect-error child loaders are outside the parent getter's scope
        parent.getData('child')
        // @ts-expect-error unknown names are rejected
        parent.getData('missing')
        return {}
      },
    })
})

test('parent.getData includes the ancestor default and named loaders', () => {
  const grandparent = createRoute({ path: '/grandparent' }).addLoader(() => 'ancestor')
    .addLoader(() => true, { name: 'ancestor' })
  const parent = createRoute({ parent: grandparent, path: '/parent' }).addLoader(() => 42, { name: 'count' })
  createRoute({ parent, path: '/child' })
    .addLoader((_route, { parent }) => {
      expectTypeOf(parent.getData()).toEqualTypeOf<Promise<string>>()
      expectTypeOf(parent.getData('ancestor')).toEqualTypeOf<Promise<boolean>>()
      return 'child'
    }, { name: 'child' })
    .addView(component, {
      props: (_route, { parent }) => {
        expectTypeOf(parent.getData()).toEqualTypeOf<Promise<string>>()
        expectTypeOf(parent.getData('default')).toEqualTypeOf<Promise<string>>()
        expectTypeOf(parent.getData('ancestor')).toEqualTypeOf<Promise<boolean>>()
        expectTypeOf(parent.getData('count')).toEqualTypeOf<Promise<number>>()
        return {}
      },
    })
})

test('a named-only parent requires a name', () => {
  const parent = createRoute({ path: '/parent' }).addLoader(() => 42, { name: 'count' })
  createRoute({ parent, path: '/child' }).addView(component, {
    props: (_route, { parent }) => {
      // @ts-expect-error no default loader exists
      parent.getData()
      expectTypeOf(parent.getData('count')).toEqualTypeOf<Promise<number>>()
      return {}
    },
  })
})

test('a parent without loaders has no accepted names', () => {
  const parent = createRoute({ path: '/parent' })
  createRoute({ parent, path: '/child' }).addView(component, {
    props: (_route, { parent }) => {
      // @ts-expect-error no default loader exists
      parent.getData()
      // @ts-expect-error no named loaders exist
      parent.getData('missing')
      return {}
    },
  })
  createRoute({ path: '/' }).addView(component, {
    props: (_route, { parent }) => {
      // @ts-expect-error a root callback has no parent
      parent.getData()
      return {}
    },
  })
})

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
