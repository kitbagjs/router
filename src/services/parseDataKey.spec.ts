import { expect, test } from 'vitest'
import { createResolvedRoute } from '@/services/createResolvedRoute'
import { createRoute } from '@/services/createRoute'
import { getDataKey } from '@/services/getDataKey'
import { parseDataKey } from '@/services/parseDataKey'

test('parses a generated key with serialized and absent state values', () => {
  const route = createRoute({ name: 'product', path: '/products/[id]', state: { page: Number, tab: String } })
  const resolved = createResolvedRoute(route, { id: '42' }, { hash: 'reviews', state: { page: 2 } })
  const key = getDataKey({ route: resolved, depth: 0, kind: 'props', name: 'default' })

  expect(parseDataKey(key)).toEqual([
    'product',
    '/products/42#reviews',
    [['page', '2'], ['tab', '']],
    0,
    'props',
    'default',
  ])
})

test('parses a fallback loader key on an unnamed route', () => {
  const route = createResolvedRoute(createRoute({ path: '/' }))
  const key = getDataKey({ route, depth: -1, kind: 'loader', name: 'fallback-1' })

  expect(parseDataKey(key)).toEqual(['', '/', [], -1, 'loader', 'fallback-1'])
})

test('throws when the key is not JSON', () => {
  expect(() => parseDataKey('not json')).toThrow(SyntaxError)
})

test.each([
  null,
  [],
  ['product', '/', [], 0, 'loader'],
  [null, '/', [], 0, 'loader', 'default'],
  ['product', null, [], 0, 'loader', 'default'],
  ['product', '/', {}, 0, 'loader', 'default'],
  ['product', '/', [['page', 2]], 0, 'loader', 'default'],
  ['product', '/', [['page']], 0, 'loader', 'default'],
  ['product', '/', [], '0', 'loader', 'default'],
  ['product', '/', [], 0.5, 'loader', 'default'],
  ['product', '/', [], -2, 'loader', 'default'],
  ['product', '/', [], 0, 'unknown', 'default'],
  ['product', '/', [], 0, 'loader', null],
].map((parts) => ({ parts })))('throws when the key parts are invalid: $parts', ({ parts }) => {
  expect(() => parseDataKey(JSON.stringify(parts))).toThrow(new TypeError('Invalid data key'))
})
