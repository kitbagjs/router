import { expect, test } from 'vitest'
import { createParam } from '@/services/createParam'
import { getParamValue, setParamValue } from '@/services/params'
import { nullable, nullKey } from '@/services/nullableParam'
import { path } from '@/services/path'
import { createRoute } from '@/services/createRoute'
import { createRouter } from './createRouter'

test.each([
  String, Number, Boolean, Date, JSON, /regexp/g, () => 'getter',
])('given any param with nullKey, getParamValue null', (param) => {
  const nullableParam = nullable(param)

  const response = getParamValue(nullKey, nullableParam)

  expect(response).toBe(null)
})

test.each([
  String, Number, Boolean, Date, JSON, /regexp/g, () => 'getter',
])('given any param with null, setParamValue returns nullKey', (param) => {
  const nullableParam = nullable(param)

  const response = setParamValue(null, nullableParam)

  expect(response).toBe('')
})

test.only('nullKey never actually put in URL', () => {
  const param = createParam(Number)
  const nullableParam = nullable(param)
  const route = createRoute({
    name: 'check-null-key',
    path: path('/[foo]', { foo: nullableParam }),
    query: path('?bar=[?bar]', { bar: nullableParam }),
  })

  const router = createRouter([route] as const, { initialUrl: '/' })
  const resolved = router.resolve('check-null-key', { foo: null, bar: null })

  expect(resolved.href).toBe('/')
})
