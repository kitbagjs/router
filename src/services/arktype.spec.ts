import { safeGetParamValue, safeSetParamValue } from './params'
import { test, expect } from 'vitest'
import { type } from 'arktype'

const discriminatedUnion = type({ kind: '"one"', value: 'string' }).or({ kind: '"two"', value: 'number' })

test.each([
  { schema: type('"foo"'), string: 'foo', parsed: 'foo' },
  { schema: type('1'), string: '1', parsed: 1 },
  { schema: type('true'), string: 'true', parsed: true },
  { schema: type('false'), string: 'false', parsed: false },
  { schema: type('string'), string: 'foo', parsed: 'foo' },
  { schema: type('string.email'), string: 'test@example.com', parsed: 'test@example.com' },
  { schema: type('number'), string: '1', parsed: 1 },
  { schema: type('bigint'), string: '123', parsed: 123n },
  { schema: type('boolean'), string: 'true', parsed: true },
  { schema: type('boolean'), string: 'false', parsed: false },
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
  { schema: type('number | undefined'), string: '12', parsed: 12 },
  { schema: type({ at: 'string' }), string: '{"at":"2026-09-21T12:00:00.000Z"}', parsed: { at: '2026-09-21T12:00:00.000Z' } },
])('given $schema.expression, returns $parsed for $string', async ({ schema, string, parsed }) => {
  if (typeof parsed === 'string' || typeof parsed === 'number' || typeof parsed === 'boolean' || typeof parsed === 'bigint') {
    expect(safeGetParamValue(string, { param: schema })).toBe(parsed)
    expect(safeSetParamValue(parsed, { param: schema })).toBe(string)
  } else {
    expect(safeGetParamValue(string, { param: schema })).toMatchObject(parsed)
    expect(safeSetParamValue(parsed, { param: schema })).toBe(string)
  }
})

test('collection defaults survive parsing and serialization', () => {
  const schema = type({ values: 'string[] = []', meta: 'object = {}' })
  const parsed = safeGetParamValue('{}', { param: schema })

  expect(parsed).toStrictEqual({ values: [], meta: {} })
  expect(safeSetParamValue({}, { param: schema })).toBe('{"values":[],"meta":{}}')
  expect(safeSetParamValue(parsed, { param: schema })).toBe('{"values":[],"meta":{}}')

  parsed?.values.push('changed')
  Object.assign(parsed?.meta ?? {}, { changed: true })

  expect(safeGetParamValue('{}', { param: schema })).toStrictEqual({ values: [], meta: {} })
  expect(safeGetParamValue('{"values":[1]}', { param: schema })).toBeUndefined()
  expect(safeSetParamValue({ values: [1] }, { param: schema })).toBeUndefined()
})

test.each([
  { name: 'required', schema: type(['string', 'number?']).required(), values: [['foo', 1]], invalid: [[], ['foo'], ['foo', 'bad'], {}] },
  { name: 'optional', schema: type(['string', 'number']).partial(), values: [[], ['foo'], ['foo', 1]], invalid: [[1], ['foo', 'bad'], {}] },
])('$name tuple elements preserve array parsing and serialization', ({ schema, values, invalid }) => {
  for (const value of values) {
    const json = JSON.stringify(value)

    expect(safeGetParamValue(json, { param: schema })).toStrictEqual(value)
    expect(safeSetParamValue(value, { param: schema })).toBe(json)
  }

  for (const value of invalid) {
    expect(safeGetParamValue(JSON.stringify(value), { param: schema })).toBeUndefined()
    expect(safeSetParamValue(value, { param: schema })).toBeUndefined()
  }
})

test.each([
  { value: [{ kind: 'one', value: 'foo' }, { kind: 'one', value: 'bar' }], valid: true },
  { value: [{ kind: 'two', value: 1 }, { kind: 'two', value: 2 }], valid: true },
  { value: [], valid: true },
  { value: [{ kind: 'one', value: 'foo' }, { kind: 'two', value: 1 }], valid: false },
  { value: [{ kind: 'one', value: 'foo' }, null], valid: false },
  { value: [null, { kind: 'two', value: 1 }], valid: false },
  { value: [{ kind: 'two', value: 'bad' }], valid: false },
  { value: { kind: 'one', value: 'foo' }, valid: false },
])('union of object arrays accepts $value: $valid', ({ value, valid }) => {
  const schema = type({ kind: '"one"', value: 'string' }).array()
    .or(type({ kind: '"two"', value: 'number' }).array())
  const json = JSON.stringify(value)

  expect(safeGetParamValue(json, { param: schema })).toStrictEqual(valid ? value : undefined)
  expect(safeSetParamValue(value, { param: schema })).toBe(valid ? json : undefined)
})
