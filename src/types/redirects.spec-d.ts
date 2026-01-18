import { createRoute } from '@/services/createRoute'
import { describe, expectTypeOf, test } from 'vitest'

const toWithoutParams = createRoute({
  name: 'to',
  path: '/to',
})

const fromWithoutParams = createRoute({
  name: 'from',
  path: '/from',
})

const toWithParams = createRoute({
  name: 'to',
  path: '/to/[toPathParam]',
  query: 'to=[toQueryParam]',
})

const fromWithParams = createRoute({
  name: 'from',
  path: '/from/[fromPathParam]',
  query: 'from=[fromQueryParam]',
})

describe('redirectTo', () => {
  test('no params are correctly typed', () => {
    fromWithoutParams.redirectTo(toWithoutParams)
  })

  test('callback params are correctly typed', () => {
    fromWithParams.redirectTo(toWithParams, (params) => {
      expectTypeOf(params).toEqualTypeOf<{ fromPathParam: string, fromQueryParam: string }>()

      return { toPathParam: 'string', toQueryParam: 'string' }
    })
  })

  test('does not accept missing params', () => {
    // @ts-expect-error - missing params
    fromWithParams.redirectTo(toWithParams, () => {
      return { toQueryParam: 'string' }
    })
  })

  test('does not accept invalid to params', () => {
    // @ts-expect-error - invalid params
    fromWithParams.redirectTo(toWithParams, () => {
      return { toPathParam: true, toQueryParam: 'string' }
    })
  })
})

describe('redirectFrom', () => {
  test('no params are correctly typed', () => {
    toWithoutParams.redirectFrom(fromWithoutParams)
  })

  test('callback params are correctly typed', () => {
    toWithParams.redirectFrom(fromWithParams, (params) => {
      expectTypeOf(params).toEqualTypeOf<{ fromPathParam: string, fromQueryParam: string }>()

      return { toPathParam: 'string', toQueryParam: 'string' }
    })
  })

  test('does not accept missing params', () => {
    // @ts-expect-error - missing params
    toWithParams.redirectFrom(fromWithParams, () => {
      return { toQueryParam: 'string' }
    })
  })

  test('does not accept invalid to params', () => {
    // @ts-expect-error - invalid params
    toWithParams.redirectFrom(fromWithParams, () => {
      return { toPathParam: true, toQueryParam: 'string' }
    })
  })
})
