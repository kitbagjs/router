import { test, expectTypeOf } from 'vitest'
import { Routes } from '@/types/routes'
import { createRouter } from '@/utilities'

test('required no arguments when there are no parameters', () => {
  const routes = [
    {
      name: 'foo',
      path: '',
    },
  ] as const satisfies Routes

  const router = createRouter(routes)

  expectTypeOf(router.routes.foo).toBeFunction()
  expectTypeOf(router.routes.foo).parameters.toEqualTypeOf<[]>()
})