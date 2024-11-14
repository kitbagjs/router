import { expect, test } from 'vitest'
import { withPath } from '@/services/withPath'

test.each(['https://kitbag.dev/', '/'])('given url that satisfies Url type, returns url + path', (url) => {
  const path = 'foo'

  const response = withPath(url, path)

  expect(response).toBe(`${url}${path}`)
})

test.each(['/foo', '///foo'])('given path with 1+ forward slashes, removes leading slashes from path', (path) => {
  const url = 'https://kitbag.dev'
  const response = withPath(url, path)

  expect(response).toBe(`${url}/foo`)
})
