import { safeGetParamValue, safeSetParamValue } from './params'
import { test, expect } from 'vitest'
import { type } from 'arktype'

const discriminatedUnion = type({ kind: '"one"', value: 'string' }).or({ kind: '"two"', value: 'number' })

test.each([
  { schema: type('"foo"'), string: 'foo', parsed: 'foo' },
  { schema: type('1'), string: '1', parsed: 1 },
  { schema: type('true'), string: 'true', parsed: true },
  { schema: type('string'), string: 'foo', parsed: 'foo' },
  { schema: type('string.email'), string: 'test@example.com', parsed: 'test@example.com' },
  { schema: type('number'), string: '1', parsed: 1 },
  { schema: type('bigint'), string: '123', parsed: 123n },
  { schema: type('boolean'), string: 'true', parsed: true },
  { schema: type('Date'), string: '2022-01-12T00:00:00.000Z', parsed: new Date('2022-01-12T00:00:00.000Z') },
  { schema: type({ foo: 'string' }), string: '{"foo":"bar"}', parsed: { foo: 'bar' } },
  { schema: type('"foo" | "bar"'), string: 'foo', parsed: 'foo' },
  { schema: type('string[]'), string: '["foo","bar"]', parsed: ['foo', 'bar'] },
  { schema: type(['string', 'number']), string: '["foo",1]', parsed: ['foo', 1] },
  { schema: type('string | number'), string: 'foo', parsed: 'foo' },
  { schema: type('string | number'), string: '1', parsed: 1 },
  { schema: type({ foo: 'string' }).or('string'), string: '{"foo":"bar"}', parsed: { foo: 'bar' } },
  { schema: discriminatedUnion, string: '{"kind":"one","value":"foo"}', parsed: { kind: 'one', value: 'foo' } },
  { schema: discriminatedUnion, string: '{"kind":"two","value":1}', parsed: { kind: 'two', value: 1 } },
  { schema: type('Record<string, string>'), string: '{"one":"two"}', parsed: { one: 'two' } },
  { schema: type('Map'), string: '[["one",1]]', parsed: new Map([['one', 1]]) },
  { schema: type('Set'), string: '[1,2,3]', parsed: new Set([1, 2, 3]) },
])('given $schema.expression, returns $parsed for $string', async ({ schema, string, parsed }) => {
  if (typeof parsed === 'string' || typeof parsed === 'number' || typeof parsed === 'boolean' || typeof parsed === 'bigint') {
    expect(safeGetParamValue(string, { param: schema })).toBe(parsed)
    expect(safeSetParamValue(parsed, { param: schema })).toBe(string)
  } else {
    expect(safeGetParamValue(string, { param: schema })).toMatchObject(parsed)
    expect(safeSetParamValue(parsed, { param: schema })).toBe(string)
  }
})
