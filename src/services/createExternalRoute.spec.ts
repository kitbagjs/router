import { expect, test } from 'vitest'
import { createExternalRoute } from '@/services/createExternalRoute'
import { DuplicateParamsError } from '@/errors/duplicateParamsError'
import { withParams } from '@/services/withParams'

test('given parent, path is combined', () => {
  const parent = createExternalRoute({
    host: 'https://kitbag.dev',
    path: '/parent',
  })

  const child = createExternalRoute({
    parent: parent,
    path: withParams('/child/[id]', { id: Number }),
  })

  expect(child.path.schema).toMatchObject({
    value: '/parent/child/[id]',
    params: {
      id: Number,
    },
  })
})

test('given parent, query is combined', () => {
  const parent = createExternalRoute({
    host: 'https://kitbag.dev',
    query: 'static=123',
  })

  const child = createExternalRoute({
    parent: parent,
    query: withParams('sort=[sort]', { sort: Boolean }),
  })

  expect(child.query.schema).toMatchObject({
    value: 'static=123&sort=[sort]',
    params: {
      sort: Boolean,
    },
  })
})

test('given parent and child without meta, meta matches parent', () => {
  const parent = createExternalRoute({
    host: 'https://kitbag.dev',
    meta: {
      foo: 123,
    },
  })

  const child = createExternalRoute({
    parent: parent,
  })

  expect(child.meta).toMatchObject({
    foo: 123,
  })
})

test.each([
  ['https://[foo].dev', '/[foo]', 'foo=[zoo]', '[bar]'],
  ['https://[zoo].dev', '/[foo]', 'foo=[bar]', '[foo]'],
  ['https://[zoo].dev', '/[bar]', 'foo=[foo]', '[foo]'],
  ['https://[zoo].dev', '/[bar]', 'foo=[foo]', '[foo]'],
])('given duplicate params across different parts of the route, throws DuplicateParamsError', (host, path, query, hash) => {
  const action: () => void = () => createExternalRoute({
    host,
    path,
    query,
    hash,
  })

  expect(action).toThrow(DuplicateParamsError)
})
