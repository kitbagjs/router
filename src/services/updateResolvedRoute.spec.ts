import { expect, test } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { createResolvedRoute } from '@/services/createResolvedRoute'
import { updateResolvedRoute } from '@/services/updateResolvedRoute'
import { isResolvedRoute } from '@/types/resolved'
import { component } from '@/utilities/testHelpers'

const route = createRoute({
  name: 'route',
  path: '/route/[id]',
  query: 'sort=[sort]',
  state: { foo: String, bar: String },
  component,
})

test('appends query and sets hash on the href, query, and hash', () => {
  const resolved = createResolvedRoute(route, { id: '1', sort: 'asc' }, { query: { page: '2' } })

  const response = updateResolvedRoute(resolved, { query: { q: 'cats' }, hash: 'results' })

  expect(response.href).toBe('/route/1?sort=asc&page=2&q=cats#results')
  expect(response.query.toString()).toBe('sort=asc&page=2&q=cats')
  expect(response.hash).toBe('#results')
})

test('keeps the route identity and params', () => {
  const resolved = createResolvedRoute(route, { id: '1', sort: 'asc' })

  const response = updateResolvedRoute(resolved, { query: { q: 'cats' } })

  expect(response.id).toBe(resolved.id)
  expect(response.name).toBe(resolved.name)
  expect(response.params).toBe(resolved.params)
})

test('given no options, leaves href, query, and hash unchanged', () => {
  const resolved = createResolvedRoute(route, { id: '1', sort: 'asc' }, { query: { page: '2' }, hash: 'top' })

  const response = updateResolvedRoute(resolved, {})

  expect(response.href).toBe(resolved.href)
  expect(response.query.toString()).toBe(resolved.query.toString())
  expect(response.hash).toBe(resolved.hash)
})

test('merges state with the new values overriding', () => {
  const resolved = createResolvedRoute(route, { id: '1', sort: 'asc' }, { state: { foo: 'a', bar: 'b' } })

  const response = updateResolvedRoute(resolved, { state: { bar: 'c' } })

  expect(response.state).toMatchObject({ foo: 'a', bar: 'c' })
})

test('returns a resolved route', () => {
  const resolved = createResolvedRoute(route, { id: '1', sort: 'asc' })

  expect(isResolvedRoute(updateResolvedRoute(resolved, { hash: 'top' }))).toBe(true)
})

test('getTitle sees the updated route', async () => {
  const titled = createRoute({
    name: 'titled',
    path: '/titled',
    component,
  })
  titled.setTitle((to) => `Results for ${to.query.get('q')}`)
  const resolved = createResolvedRoute(titled)

  const response = updateResolvedRoute(resolved, { query: { q: 'cats' } })

  await expect(response.getTitle()).resolves.toBe('Results for cats')
})
