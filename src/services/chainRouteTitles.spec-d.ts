import { expectTypeOf, test } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { createRouter } from '@/services/createRouter'
import { component } from '@/utilities/testHelpers'

test('setTitle chains preserve route types and type the title callback', () => {
  const route = createRoute({ name: 'user', path: '/users/[id]' })
    .setTitle((to, context) => {
      expectTypeOf<keyof typeof context>().toEqualTypeOf<'getParentTitle' | 'parent' | 'signal'>()
      expectTypeOf(to.params.id).toEqualTypeOf<string>()
      expectTypeOf(context.parent).toBeUndefined()
      return to.params.id
    })
    .addView(component)
    .addLoader(() => 42)
    .onBeforeRouteEnter(() => {})
    .setTitle(() => 'User')

  expectTypeOf(route.setTitle(() => 'Updated')).toEqualTypeOf(route)
  expectTypeOf(createRouter([route]).route.loaders.default.load).returns.toEqualTypeOf<number>()
  // @ts-expect-error titles must resolve to strings
  route.setTitle(() => 42)
})

test('title callbacks infer parent loaders and props', () => {
  const parent = createRoute({ path: '/parent' })
    .addLoader(() => ({ name: 'Parent' }))
    .addView(component, { props: () => ({ count: 1 }) })

  createRoute({ parent, path: '/child' }).setTitle(async (_to, { parent }) => {
    const data = await parent.getData()
    const props = await parent.getProps()
    expectTypeOf(data.name).toEqualTypeOf<string>()
    expectTypeOf(props.count).toEqualTypeOf<number>()
    // @ts-expect-error parent loaders retain their declared names
    parent.getData('missing')

    return `${await parent.getTitle()} ${data.name} ${props.count}`
  })
})
