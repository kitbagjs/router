import { expect, test } from 'vitest'
import { withHash } from '@/services/withHash'
import { hash as createHash } from './hash'

test.each([undefined, ''])('given hash without value, returns url unmodified', (value) => {
  const url = 'https://www.github.io'

  const response = withHash(url, { value })

  expect(response).toBe(url)
})

test.each(['https://www.github.io', '/foo'])('given hash with value, returns url + # + hash', (url) => {
  const hash = createHash('bar')
  const response = withHash(url, hash)

  expect(response).toBe(`${url}#bar`)
})

test.each(['https://www.github.io', '/foo'])('given hash with # + value, returns url + # + hash', (url) => {
  const hash = createHash('#bar')
  const response = withHash(url, hash)

  expect(response).toBe(`${url}#bar`)
})
