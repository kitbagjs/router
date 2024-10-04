import { expect, test } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { path } from '@/services/path'
import { query } from '@/services/query'

test('given parent, path is combined', () => {
  const parent = createRoute({
    path: '/parent',
  })

  const child = createRoute({
    parent: parent,
    path: path('/child/[id]', { id: Number }),
  })

  expect(child.path).toMatchObject({
    value: '/parent/child/[id]',
    params: {
      id: Number,
    },
  })
})

test('given parent, query is combined', () => {
  const parent = createRoute({
    query: 'static=123',
  })

  const child = createRoute({
    parent: parent,
    query: query('sort=[sort]', { sort: Boolean }),
  })

  expect(child.query).toMatchObject({
    value: 'static=123&sort=[sort]',
    params: {
      sort: Boolean,
    },
  })
})

test('given parent, state is combined into state', () => {
  const parent = createRoute({
    state: {
      foo: Number,
    },
  })

  const child = createRoute({
    parent: parent,
    state: {
      bar: String,
    },
  })

  expect(child.state).toMatchObject({
    foo: Number,
    bar: String,
  })
})

test('given parent and child without state, state matches parent', () => {
  const parent = createRoute({
    state: {
      foo: Number,
    },
  })

  const child = createRoute({
    parent: parent,
  })

  expect(child.state).toMatchObject({
    foo: Number,
  })
})

test('given parent, meta is combined', () => {
  const parent = createRoute({
    meta: {
      foo: 123,
    },
  })

  const child = createRoute({
    parent: parent,
    meta: {
      bar: 'zoo',
    },
  })

  expect(child.meta).toMatchObject({
    foo: 123,
    bar: 'zoo',
  })
})

test('given parent and child without meta, meta matches parent', () => {
  const parent = createRoute({
    meta: {
      foo: 123,
    },
  })

  const child = createRoute({
    parent: parent,
  })

  expect(child.meta).toMatchObject({
    foo: 123,
  })
})