import { expect, expectTypeOf, test } from 'vitest'
import { getParamValue, setParamValue } from '@/services/params'
import { oneOf } from '@/services/oneOf'
import { InvalidRouteParamValueError } from '@/errors/invalidRouteParamValueError'
import { createRoute } from './createRoute'
import { path } from './path'
import { RouteParamsByKey } from '@/types/routeWithParams'

test('when using oneOf, types of possible values are expected param type', () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const routes = [
    createRoute({
      name: 'test',
      path: path('/[foo]', { foo: oneOf(['bar', 14, false]) }),
    }),
  ] as const

  type RouterRoute = RouteParamsByKey<typeof routes, 'test'>

  expectTypeOf<RouterRoute>().toEqualTypeOf<{ foo: 'bar' | 14 | false }>()
})

test('when using oneOf with specific values that match, does nothing', () => {
  const param = oneOf(['foo', 'bar'])

  const getterResult = getParamValue('foo', param)
  expect(getterResult).toBe('foo')

  const setterResult = setParamValue('bar', param)
  expect(setterResult).toBe('bar')
})

test('when using oneOf with specific values that do NOT match, throws InvalidRouteParamValueError', () => {
  const param = oneOf(['foo', 'bar'])

  const getterAction: () => void = () => getParamValue('baz', param)
  expect(getterAction).toThrow(InvalidRouteParamValueError)

  const setterAction: () => void = () => setParamValue('baz', param)
  expect(setterAction).toThrow(InvalidRouteParamValueError)
})

test('when using oneOf with specific values other than strings works the same', () => {
  const param = oneOf([14, 24])

  const getterResult = getParamValue('14', param)
  expect(getterResult).toBe('14')
})
