import { expect, test } from 'vitest'
import { getRegexMatcher } from './getRegexMatcher'

test.each([
  [/^yes$/],
  [/^yes$/i],
])('given non-stateful regex %s, returns the original regex', (regex) => {
  regex.lastIndex = 7

  const matcher = getRegexMatcher(regex)

  expect(matcher).toBe(regex)
  expect(matcher.lastIndex).toBe(7)
})

test.each([
  [/^yes$/g],
  [/^yes$/y],
  [/^yes$/gy],
  [/^yes$/gimsu],
])('given stateful regex %s, copies the pattern and flags without changing the original', (regex) => {
  regex.lastIndex = 7

  const matcher = getRegexMatcher(regex)

  expect(matcher).not.toBe(regex)
  expect(matcher.source).toBe(regex.source)
  expect(matcher.flags).toBe(regex.flags)
  expect(matcher.lastIndex).toBe(0)
  expect(regex.lastIndex).toBe(7)
})
