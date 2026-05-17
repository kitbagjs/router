import { expectTypeOf, test } from 'vitest'
import { createRoute } from '@/services/createRouteChaining'
import { Url } from '@/types/url'
import echo from '@/components/echo'
import helloWorld from '@/components/helloWorld'

test('chained route types are expanded', () => {
  const route = createRoute({ name: 'home', path: '/' })
    .addView(echo, () => ({ value: 'hello' }))
    .addView('sidebar', helloWorld)

  expectTypeOf(route.name).toEqualTypeOf<'home'>()
  expectTypeOf(route.url).toEqualTypeOf<Url<{}>>()
  expectTypeOf(route.views).toEqualTypeOf<{
    default: () => { value: string },
    sidebar: never,
  }>()
})
