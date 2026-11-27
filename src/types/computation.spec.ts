import { expect, test } from 'vitest'
import { isDataKind } from '@/types/computation'

test.each(['props', 'loader', 'tags'])('recognizes %s as a computation kind', (kind) => {
  expect(isDataKind(kind)).toBe(true)
})

test.each(['other', 'toString', undefined])('rejects %s as a computation kind', (kind) => {
  expect(isDataKind(kind)).toBe(false)
})
