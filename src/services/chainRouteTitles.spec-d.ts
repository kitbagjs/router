import { expectTypeOf, test } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { createRouter } from '@/services/createRouter'
import { ResolvedRoute } from '@/types/resolved'
import { component } from '@/utilities/testHelpers'

test('setTitle chains preserve route types and type the title callback', () => {
  const route = createRoute({ name: 'user', path: '/users/[id]' })
    .setTitle((to, { from, getParentTitle }) => {
      expectTypeOf(from).toEqualTypeOf<ResolvedRoute | null>()
      expectTypeOf(to.params.id).toEqualTypeOf<string>()
      expectTypeOf(getParentTitle()).toEqualTypeOf<Promise<string | undefined>>()
      return to.params.id
    })
    .addView(component)
    .addLoader(() => 42)
    .onBeforeRouteEnter(() => {})
    .setTitle(() => 'User')

  expectTypeOf(route.setTitle(() => 'Updated')).toEqualTypeOf(route)
  expectTypeOf(createRouter([route]).route.data).toEqualTypeOf<Promise<number>>()
  // @ts-expect-error titles must resolve to strings
  route.setTitle(() => 42)
})
