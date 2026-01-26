import { expectTypeOf, test } from 'vitest'
import { RouteMeta } from './register'

test('given route meta in router options, RouteMeta is correct', () => {
  type Meta = RouteMeta<{ routeMeta: { zoo: number } }>

  expectTypeOf<Meta>().toEqualTypeOf<{ zoo: number }>()
})
