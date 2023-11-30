import { test, expectTypeOf } from 'vitest'
import { Routes } from '@/types/routes'
import { createRouter } from '@/utilities'

test('requires no arguments when there are no parameters', () => {
  const routes = [
    {
      name: 'foo',
      path: '',
    },
  ] as const satisfies Routes

  const router = createRouter(routes)

  expectTypeOf(router.routes.foo).parameters.toEqualTypeOf<[]>()
})

test('does not match single colons as params', () => {
  const routes = [
    {
      name: 'foo',
      path: ':',
    },
  ] as const satisfies Routes

  const router = createRouter(routes)

  expectTypeOf(router.routes.foo).parameters.toEqualTypeOf<[]>()
})

test('does not match :? as params', () => {
  const routes = [
    {
      name: 'foo',
      path: ':?',
    },
  ] as const satisfies Routes

  const router = createRouter(routes)

  router.routes.foo()

  expectTypeOf(router.routes.foo).parameters.toEqualTypeOf<[]>()
})