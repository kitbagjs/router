import { expect, test } from 'vitest'
import { DuplicateParamsError } from '@/errors'
import { host } from '@/services/host'

test('given host without params, returns empty object', () => {
  const response = host('kitbag.dev', {})

  expect(response.params).toMatchObject({})
})

test('given host with simple params, returns each param name as type String', () => {
  const response = host('[subdomain]kitbag.dev', {})

  expect(response.params).toMatchObject({
    subdomain: String,
  })
})

test('given host with optional params, returns each param name as type String', () => {
  const response = host('[?subdomain]kitbag.dev', {})

  expect(JSON.stringify(response.params)).toMatch(JSON.stringify({
    subdomain: String,
  }))
})

test('given host with param types, returns each param with corresponding param', () => {
  const response = host('[subdomain]kitbag.dev', {
    subdomain: Boolean,
  })

  expect(response.params).toMatchObject({
    subdomain: Boolean,
  })
})

test('given host with the same param name, throws DuplicateParamsError', () => {
  const action: () => void = () => host('[?subdomain]kitbag.[subdomain]', { })

  expect(action).toThrowError(DuplicateParamsError)
})
