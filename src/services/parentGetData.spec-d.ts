import { expectTypeOf, test } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { component } from '@/utilities/testHelpers'

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

test('a named-only parent requires a name and does not include ancestors', () => {
  const grandparent = createRoute({ path: '/grandparent' }).addLoader(() => 'ancestor')
  const parent = createRoute({ parent: grandparent, path: '/parent' }).addLoader(() => 42, { name: 'count' })
  createRoute({ parent, path: '/child' }).addView(component, {
    props: (_route, { parent }) => {
      expectTypeOf(parent.getData('count')).toEqualTypeOf<Promise<number>>()
      // @ts-expect-error the immediate parent has no default loader
      parent.getData()
      // @ts-expect-error an ancestor default is outside the getter's scope
      parent.getData('default')
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
