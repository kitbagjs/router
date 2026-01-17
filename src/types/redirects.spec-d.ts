import { createRoute } from '@/services/createRoute'
import { describe, expectTypeOf, test, vi } from 'vitest'
import { RouteRedirectCallback, RouteRedirectFrom, RouteRedirectTo } from './redirects'

const to = createRoute({
  name: 'route',
  path: '/route/[toPathParam]',
  query: 'to=[toQueryParam]',
})

const from = createRoute({
  name: 'from',
  path: '/from/[fromPathParam]',
  query: 'from=[fromQueryParam]',
})

describe('RouteRedirectCallback', () => {
  type Callback = RouteRedirectCallback<typeof to, typeof from>

  test('parameters are correctly typed', () => {
    type Source = Parameters<Callback>[0]
    type Expect = { fromPathParam: string, fromQueryParam: string }

    expectTypeOf<Source>().toEqualTypeOf<Expect>()
  })

  test('return type is correctly typed', () => {
    type Source = ReturnType<Callback>
    type Expect = { toPathParam: string, toQueryParam: string }

    expectTypeOf<Source>().toEqualTypeOf<Expect>()
  })
})

describe('RouteRedirectTo', () => {
  const redirectTo: RouteRedirectTo<typeof from> = vi.fn()

  test('return type is void', () => {
    // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
    expectTypeOf<ReturnType<typeof redirectTo>>().toEqualTypeOf<void>()
  })

  test('callback params are correctly typed', () => {
    redirectTo(from, (params) => {
      expectTypeOf(params).toEqualTypeOf<{ fromPathParam: string, fromQueryParam: string }>()

      return { fromPathParam: 'string', fromQueryParam: 'string' }
    })
  })

  test('callback type errors if return type is not valid', () => {
    // @ts-expect-error - invalid return type
    redirectTo(from, () => {
      return { fromPathParam: true, fromQueryParam: 'string' }
    })
  })
})

describe('RouteRedirectFrom', () => {
  const redirectFrom: RouteRedirectFrom<typeof to> = vi.fn()
  const validResponse = { toPathParam: 'string', toQueryParam: 'string' }

  test('return type is void', () => {
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
    expectTypeOf<ReturnType<typeof redirectFrom>>().toEqualTypeOf<void>()
  })

  test('callback return type is correctly typed', () => {
    redirectFrom(from, () => {
      return validResponse
    })
  })

  test('callback params are correctly typed', () => {
    redirectFrom(from, (params) => {
      expectTypeOf(params).toEqualTypeOf<{ fromPathParam: string, fromQueryParam: string }>()

      return validResponse
    })
  })

  test('callback type errors if return type is not valid', () => {
    // @ts-expect-error - invalid return type
    redirectFrom(to, () => {
      return { fromPathParam: true, fromQueryParam: 'string' }
    })
  })
})
