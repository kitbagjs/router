import { expect, test } from 'vitest'
import { MetaPropertyConflict } from '@/errors/metaPropertyConflict'
import { combineMeta } from '@/services/combineMeta'

test('given 2 meta objects, returns new meta joined together', () => {
  const aMeta = { foz: 123 }
  const bMeta = { baz: 'baz' }

  const response = combineMeta(aMeta, bMeta)

  expect(response).toMatchObject({
    foz: 123,
    baz: 'baz',
  })
})

test('given 2 meta objects with duplicate properties but same type, overrides parent value with child', () => {
  const aMeta = { foz: 123 }
  const bMeta = { foz: 456 }

  const response = combineMeta(aMeta, bMeta)

  expect(response).toMatchObject({
    foz: 456,
  })
})

test('given 2 meta objects with duplicate properties with DIFFERENT types, throws MetaPropertyConflict error', () => {
  const aMeta = { foz: 123 }
  const bMeta = { foz: 'baz' }

  const action: () => void = () => combineMeta(aMeta, bMeta)

  expect(action).toThrow(MetaPropertyConflict)
})
