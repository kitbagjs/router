import { safeGetParamValue, safeSetParamValue } from './params'
import { test, expect } from 'vitest'
import * as v from 'valibot'

enum Fruits {
  Apple = 0,
  Banana = 1
}

const discriminatedUnion = v.variant('type', [
  v.object({ type: v.literal('one'), value: v.string() }),
  v.object({ type: v.literal('two'), value: v.number() }),
])

test.each([
  { schema: v.literal('foo'), string: 'foo', parsed: 'foo' },
  { schema: v.literal(1), string: '1', parsed: 1 },
  { schema: v.literal(true), string: 'true', parsed: true },
  { schema: v.literal(false), string: 'false', parsed: false },
  { schema: v.string(), string: 'foo', parsed: 'foo' },
  { schema: v.number(), string: '1', parsed: 1 },
  { schema: v.boolean(), string: 'true', parsed: true },
  { schema: v.boolean(), string: 'false', parsed: false },
  { schema: v.date(), string: '2022-01-12T00:00:00.000Z', parsed: new Date('2022-01-12T00:00:00.000Z') },
  { schema: v.object({ foo: v.string() }), string: '{"foo":"bar"}', parsed: { foo: 'bar' } },
  { schema: v.object({ foo: v.nullable(v.string()) }), string: '{"foo":null}', parsed: { foo: null } },
  { schema: v.object({ foo: v.optional(v.string()) }), string: '{}', parsed: {} },
  { schema: v.enum(Fruits), string: '0', parsed: Fruits.Apple },
  { schema: v.array(v.string()), string: '["foo","bar"]', parsed: ['foo', 'bar'] },
  { schema: v.tuple([v.string(), v.number()]), string: '["foo",1]', parsed: ['foo', 1] },
  { schema: v.union([v.string(), v.number()]), string: 'foo', parsed: 'foo' },
  { schema: v.union([v.string(), v.number()]), string: '1', parsed: 1 },
  { schema: v.union([v.string(), v.object({ foo: v.string() })]), string: '{"foo":"bar"}', parsed: { foo: 'bar' } },
  { schema: discriminatedUnion, string: '{"type":"one","value":"foo"}', parsed: { type: 'one', value: 'foo' } },
  { schema: discriminatedUnion, string: '{"type":"two","value":1}', parsed: { type: 'two', value: 1 } },
  { schema: v.record(v.string(), v.object({ foo: v.string() })), string: '{"one":{"foo":"bar"}}', parsed: { one: { foo: 'bar' } } },
  { schema: v.map(v.string(), v.number()), string: '[["one",1]]', parsed: new Map([['one', 1]]) },
  { schema: v.set(v.number()), string: '[1,2,3]', parsed: new Set([1, 2, 3]) },
  { schema: v.bigint(), string: '123', parsed: 123n },
  { schema: v.picklist([1, 2]), string: '1', parsed: 1 },
  { schema: v.optional(v.number()), string: '12', parsed: 12 },
  { schema: v.nullable(v.number()), string: '12', parsed: 12 },
  { schema: v.nullish(v.string()), string: 'hello', parsed: 'hello' },
  { schema: v.optional(v.string()), string: 'hello', parsed: 'hello' },
  { schema: v.object({ at: v.string() }), string: '{"at":"2026-09-21T12:00:00.000Z"}', parsed: { at: '2026-09-21T12:00:00.000Z' } },
  { schema: v.object({ at: v.date() }), string: '{"at":"2026-09-21T12:00:00.000Z"}', parsed: { at: new Date('2026-09-21T12:00:00.000Z') } },
])('given $schema.type, returns $parsed for $string', async ({ schema, string, parsed }) => {
  if (typeof parsed === 'string' || typeof parsed === 'number' || typeof parsed === 'boolean' || typeof parsed === 'bigint') {
    expect(safeGetParamValue(string, { param: schema })).toBe(parsed)
    expect(safeSetParamValue(parsed, { param: schema })).toBe(string)
  } else {
    expect(safeGetParamValue(string, { param: schema })).toMatchObject(parsed)
    expect(safeSetParamValue(parsed, { param: schema })).toBe(string)
  }
})

test.each([
  { schema: v.intersect([v.object({ foo: v.string() }), v.object({ bar: v.number() })]), type: 'Intersection' },
  { schema: v.promise(), type: 'Promise' },
  { schema: v.function(), type: 'Function' },
])('$type schemas are not supported', async ({ schema }) => {
  expect(safeGetParamValue('test', { param: schema })).toBeUndefined()
  expect(safeSetParamValue('test', { param: schema })).toBeUndefined()
})

test('collection defaults survive parsing and serialization', () => {
  const schema = v.object({
    values: v.optional(v.array(v.string()), () => []),
    meta: v.optional(v.record(v.string(), v.unknown()), () => ({})),
  })
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
  { name: 'required', schema: v.tuple([v.string(), v.number()]), values: [['foo', 1]], invalid: [[], ['foo'], ['foo', 'bad'], {}] },
  { name: 'optional', schema: v.tuple([v.optional(v.string()), v.optional(v.number())]), values: [['foo', 1]], invalid: [[1], ['foo', 'bad'], {}] },
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
  const schema = v.union([
    v.array(v.object({ kind: v.literal('one'), value: v.string() })),
    v.array(v.object({ kind: v.literal('two'), value: v.number() })),
  ])
  const json = JSON.stringify(value)

  expect(safeGetParamValue(json, { param: schema })).toStrictEqual(valid ? value : undefined)
  expect(safeSetParamValue(value, { param: schema })).toBe(valid ? json : undefined)
})

test('optional tuple elements preserve undefined output from validation', () => {
  const schema = v.tuple([v.optional(v.string()), v.optional(v.number())])

  expect(safeGetParamValue('[]', { param: schema })).toStrictEqual([undefined, undefined])
  expect(safeGetParamValue('["foo"]', { param: schema })).toStrictEqual(['foo', undefined])
  // JSON serializes undefined array entries as null; these are not lossless round trips.
  expect(safeSetParamValue([], { param: schema })).toBe('[null,null]')
  expect(safeSetParamValue(['foo'], { param: schema })).toBe('["foo",null]')
  expect(safeGetParamValue('["foo",null]', { param: schema })).toBeUndefined()
})

test.each([
  { name: 'required', schema: v.required(v.object({ value: v.optional(v.string()) })), values: [{ value: 'foo' }], invalid: [{}, { value: 1 }] },
  { name: 'partial', schema: v.partial(v.object({ value: v.string() })), values: [{}, { value: 'foo' }], invalid: [{ value: 1 }] },
])('$name object properties are respected when parsing and serializing', ({ schema, values, invalid }) => {
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
