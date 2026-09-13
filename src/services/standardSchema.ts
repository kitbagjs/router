import { UnsupportedSchemaVendorError } from '@/errors/unsupportedSchemaVendorError'
import { ParamGetSet } from '@/types/paramTypes'
import { isRecord } from '@/utilities/guards'
import { isPromise } from '@/utilities/promises'
import { StandardSchemaV1 } from '@standard-schema/spec'

export interface ZodSchemaLike extends StandardSchemaV1<any> {
  parse: (input: any) => any,
  def: { type: string },
}

export interface ValibotSchemaLike extends StandardSchemaV1<any> {
  type: string,
}

export type StandardSchemaLike = ZodSchemaLike | ValibotSchemaLike

export function isZodSchema(value: unknown): value is ZodSchemaLike {
  return isRecord(value)
    && 'parse' in value
    && typeof value.parse === 'function'
    && 'def' in value
    && isRecord(value.def)
    && typeof value.def.type === 'string'
    && '~standard' in value
    && isRecord(value['~standard'])
    && 'vendor' in value['~standard']
    && value['~standard'].vendor === 'zod'
}

export function isValibotSchema(value: unknown): value is ValibotSchemaLike {
  return isRecord(value)
    && 'type' in value
    && typeof value.type === 'string'
    && '~standard' in value
    && isRecord(value['~standard'])
    && 'vendor' in value['~standard']
    && value['~standard'].vendor === 'valibot'
}

export function isStandardSchema(value: unknown): value is StandardSchemaLike {
  return isZodSchema(value) || isValibotSchema(value)
}

export function createStandardSchemaParam<T>(schema: StandardSchemaLike): ParamGetSet<T> {
  return {
    get: (value, { invalid }) => {
      try {
        return parseStandardSchemaValue(value, schema) as T
      } catch {
        throw invalid()
      }
    },
    set: (value, { invalid }) => {
      try {
        return stringifyStandardSchemaValue(value, schema)
      } catch {
        throw invalid()
      }
    },
  }
}

// inferring the return type is preferred for this function
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function parse(schema: StandardSchemaLike, value: unknown) {
  const result = schema['~standard'].validate(value)

  if (isPromise(result)) {
    throw new Error('Promise schemas are not supported')
  }

  if (result.issues) {
    throw new Error('Validation failed')
  }

  return result.value
}

function getSchemaType(schema: StandardSchemaLike): string {
  if (isZodSchema(schema)) {
    return getZodSchemaType(schema)
  }

  if (isValibotSchema(schema)) {
    return getValibotSchemaType(schema)
  }

  throw new UnsupportedSchemaVendorError(schema)
}

function getZodSchemaType(schema: ZodSchemaLike): string {
  return schema.def.type
}

/**
 * The valibot names for schemas the dispatcher knows by another name.
 */
const valibotTypeAliases: Record<string, string> = {
  picklist: 'enum',
  variant: 'union',
  intersect: 'intersection',
}

function getValibotSchemaType(schema: ValibotSchemaLike): string {
  return valibotTypeAliases[schema.type] ?? schema.type
}

function getSchemaOptions(schema: StandardSchemaLike): StandardSchemaLike[] | undefined {
  if (isZodSchema(schema)) {
    return getZodSchemaOptions(schema)
  }

  if (isValibotSchema(schema)) {
    return getValibotSchemaOptions(schema)
  }

  throw new UnsupportedSchemaVendorError(schema)
}

function getZodSchemaOptions(schema: ZodSchemaLike): StandardSchemaLike[] | undefined {
  return 'options' in schema.def ? schema.def.options as StandardSchemaLike[] : undefined
}

function getValibotSchemaOptions(schema: ValibotSchemaLike): StandardSchemaLike[] | undefined {
  return 'options' in schema ? schema.options as StandardSchemaLike[] : undefined
}

const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/

function reviver(_key: string, value: any): any {
  if (typeof value === 'string' && isoDateRegex.test(value)) {
    const date = new Date(value)

    if (isNaN(date.getTime())) {
      return value
    }

    return date
  }

  return value
}

function tryAll<T>(fns: (() => T)[]): T {
  for (const fn of fns) {
    try {
      return fn()
    } catch {
      continue
    }
  }

  throw new Error('All functions failed')
}

// Sorts string schemas last
function sortStandardSchemas(schemaA: StandardSchemaLike, schemaB: StandardSchemaLike): number {
  return getSchemaType(schemaA) === 'string' ? 1 : getSchemaType(schemaB) === 'string' ? -1 : 0
}

function parseStandardSchemaValue(value: string, schema: StandardSchemaLike): unknown {
  const type = getSchemaType(schema)

  if (type === 'string') {
    return parse(schema, value)
  }

  if (type === 'boolean') {
    return parse(schema, Boolean(value))
  }

  if (type === 'date') {
    return parse(schema, new Date(value))
  }

  if (type === 'number') {
    return parse(schema, Number(value))
  }

  if (type === 'bigint') {
    return parse(schema, BigInt(value))
  }

  if (type === 'nan') {
    return parse(schema, Number(value))
  }

  if (type === 'literal' || type === 'enum') {
    return tryAll([
      () => parse(schema, Number(value)),
      () => parse(schema, Boolean(value)),
      () => parse(schema, value),
    ])
  }

  if (type === 'object' || type === 'array' || type === 'tuple' || type === 'record') {
    return parse(schema, JSON.parse(value, reviver))
  }

  if (type === 'union') {
    const options = getSchemaOptions(schema)

    if (options) {
      const schemas = Array
        .from(options)
        .sort(sortStandardSchemas)
        .map((schema) => () => parseStandardSchemaValue(value, schema))

      return tryAll(schemas)
    }
  }

  if (type === 'map') {
    return parse(schema, new Map(JSON.parse(value, reviver)))
  }

  if (type === 'set') {
    return parse(schema, new Set(JSON.parse(value, reviver)))
  }

  if (type === 'intersection') {
    throw new Error('Intersection schemas are not supported')
  }

  if (type === 'promise') {
    throw new Error('Promise schemas are not supported')
  }

  if (type === 'function') {
    throw new Error('Function schemas are not supported')
  }

  return parse(schema, value)
}

function stringifyStandardSchemaValue(value: unknown, schema: StandardSchemaLike): string {
  const type = getSchemaType(schema)

  if (type === 'string' || type === 'boolean' || type === 'nan' || type === 'literal' || type === 'enum') {
    return String(parse(schema, value))
  }

  if (type === 'date') {
    return parse(schema, value).toISOString()
  }

  if (type === 'number') {
    return String(parse(schema, Number(value)))
  }

  if (type === 'bigint') {
    return String(parse(schema, BigInt(String(value))))
  }

  if (type === 'object' || type === 'array' || type === 'tuple' || type === 'record') {
    return JSON.stringify(parse(schema, value))
  }

  if (type === 'union') {
    const options = getSchemaOptions(schema)

    if (options) {
      const schemas = Array
        .from(options)
        .sort(sortStandardSchemas)
        .map((schema) => () => stringifyStandardSchemaValue(value, schema))

      return tryAll(schemas)
    }
  }

  if (type === 'map') {
    return JSON.stringify(Array.from(parse(schema, value).entries()))
  }

  if (type === 'set') {
    return JSON.stringify(Array.from(parse(schema, value).values()))
  }

  if (type === 'intersection') {
    throw new Error('Intersection schemas are not supported')
  }

  if (type === 'promise') {
    throw new Error('Promise schemas are not supported')
  }

  if (type === 'function') {
    throw new Error('Function schemas are not supported')
  }

  return JSON.stringify(parse(schema, value))
}
