import { describe, expect, test } from 'vitest'
import { InvalidRouteParamValueError, Route } from '@/types'
import { path, resolveRoutes } from '@/utilities'
import { assembleUrl } from '@/utilities/urlAssembly'

const component = { template: '<div>This is component</div>' }

describe('assembleUrl', () => {
  test.each([
    ['/simple'],
    [path('/simple', {})],
  ])('given simple route with string path and without params, returns route path', (path) => {
    const route = {
      name: 'simple',
      path,
      component,
    } satisfies Route
    const [resolved] = resolveRoutes([route])

    const url = assembleUrl(resolved, {})

    expect(url).toBe('/simple')
  })

  test.each([
    ['/simple/:?simple'],
    [path('/simple/:?simple', { simple: String })],
  ])('given route with optional string param NOT provided, returns route Path with string without values interpolated', (path) => {
    const route = {
      name: 'simple',
      path,
      component,
    } satisfies Route
    const [resolved] = resolveRoutes([route])

    const url = assembleUrl(resolved, {})

    expect(url).toBe('/simple/')
  })

  test.each([
    ['/simple/:?simple'],
    [path('/simple/:?simple', { simple: String })],
  ])('given route with optional string param provided, returns route Path with string with values interpolated', (path) => {
    const route = {
      name: 'simple',
      path,
      component,
    } satisfies Route
    const [resolved] = resolveRoutes([route])

    const url = assembleUrl(resolved, { simple: ['ABC'] })

    expect(url).toBe('/simple/ABC')
  })

  test.each([
    ['/simple/:simple'],
    [path('/simple/:simple', { simple: String })],
  ])('given route with required string param NOT provided, throws error', (path) => {
    const route = {
      name: 'simple',
      path,
      component,
    } satisfies Route
    const [resolved] = resolveRoutes([route])

    expect(() => assembleUrl(resolved, {})).toThrowError(InvalidRouteParamValueError)
  })

  test.each([
    ['/simple/:simple'],
    [path('/simple/:simple', { simple: String })],
  ])('given route with required string param provided, returns route Path with string with values interpolated', (path) => {
    const route = {
      name: 'simple',
      path,
      component,
    } satisfies Route
    const [resolved] = resolveRoutes([route])

    const url = assembleUrl(resolved, { simple: ['ABC'] })

    expect(url).toBe('/simple/ABC')
  })
})