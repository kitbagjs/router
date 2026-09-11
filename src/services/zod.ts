import { ParamGetSet } from '@/types/paramTypes'
import { isRecord } from '@/utilities/guards'
import { StandardSchemaV1 } from '@standard-schema/spec'
import { type ZodType } from 'zod'

export interface ZodSchemaLike extends StandardSchemaV1<any> {
  parse: (input: any) => any,
}

export function isZodSchema(value: unknown): value is ZodType {
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

export function createZodParam<T>(schema: ZodType<T>): ParamGetSet<T> {
  return {
    get: (value, { invalid }) => {
      try {
        return parseZodValue(value, schema) as T
      } catch {
        throw invalid()
      }
    },
    set: (value, { invalid }) => {
      try {
        return stringifyZodValue(value, schema)
      } catch {
        throw invalid()
      }
    },
  }
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
function sortZodSchemas(schemaA: ZodType, schemaB: ZodType): number {
  return schemaA.def.type === 'string' ? 1 : schemaB.def.type === 'string' ? -1 : 0
}

function parseZodValue(value: string, schema: ZodType): unknown {
  if (schema.def.type === 'string') {
    return schema.parse(value)
  }

  if (schema.def.type === 'boolean') {
    return schema.parse(Boolean(value))
  }

  if (schema.def.type === 'date') {
    return schema.parse(new Date(value))
  }

  if (schema.def.type === 'number') {
    return schema.parse(Number(value))
  }

  if (schema.def.type === 'bigint') {
    return schema.parse(BigInt(value))
  }

  if (schema.def.type === 'nan') {
    return schema.parse(Number(value))
  }

  if (schema.def.type === 'literal') {
    return tryAll([
      () => schema.parse(Number(value)),
      () => schema.parse(Boolean(value)),
      () => schema.parse(value),
    ])
  }

  if (schema.def.type === 'object') {
    return schema.parse(JSON.parse(value, reviver))
  }

  if (schema.def.type === 'enum') {
    return schema.parse(value)
  }

  if (schema.def.type === 'array') {
    return schema.parse(JSON.parse(value, reviver))
  }

  if (schema.def.type === 'tuple') {
    return schema.parse(JSON.parse(value, reviver))
  }

  if (schema.def.type === 'union' && 'options' in schema.def) {
    const schemas = Array
      .from(schema.def.options as ZodType[])
      .sort(sortZodSchemas)
      .map((schema: ZodType) => () => parseZodValue(value, schema))

    return tryAll(schemas)
  }

  if (schema.def.type === 'record') {
    return schema.parse(JSON.parse(value, reviver))
  }

  if (schema.def.type === 'map') {
    return schema.parse(new Map(JSON.parse(value, reviver)))
  }

  if (schema.def.type === 'set') {
    return schema.parse(new Set(JSON.parse(value, reviver)))
  }

  if (schema.def.type === 'intersection') {
    throw new Error('Intersection schemas are not supported')
  }

  if (schema.def.type === 'promise') {
    throw new Error('Promise schemas are not supported')
  }

  return schema.parse(value)
}

function stringifyZodValue(value: unknown, schema: ZodType): string {
  if (schema.def.type === 'string') {
    return String(schema.parse(value))
  }

  if (schema.def.type === 'boolean') {
    return String(schema.parse(value))
  }

  if (schema.def.type === 'date') {
    const parsed = schema.parse(value) as Date

    return parsed.toISOString()
  }

  if (schema.def.type === 'number') {
    return String(schema.parse(Number(value)))
  }

  if (schema.def.type === 'bigint') {
    return String(schema.parse(BigInt(String(value))))
  }

  if (schema.def.type === 'nan') {
    return String(schema.parse(value))
  }

  if (schema.def.type === 'literal') {
    return String(schema.parse(value))
  }

  if (schema.def.type === 'object') {
    return JSON.stringify(schema.parse(value))
  }

  if (schema.def.type === 'enum') {
    const parsed = schema.parse(value)

    return typeof parsed === 'string' ? parsed : String(parsed)
  }

  if (schema.def.type === 'array') {
    return JSON.stringify(schema.parse(value))
  }

  if (schema.def.type === 'tuple') {
    return JSON.stringify(schema.parse(value))
  }

  if (schema.def.type === 'union' && 'options' in schema.def) {
    const schemas = Array
      .from(schema.def.options as ZodType[])
      .sort(sortZodSchemas)
      .map((schema: ZodType) => () => stringifyZodValue(value, schema))

    return tryAll(schemas)
  }

  if (schema.def.type === 'record') {
    return JSON.stringify(schema.parse(value))
  }

  if (schema.def.type === 'map') {
    const parsed = schema.parse(value) as Map<unknown, unknown>

    return JSON.stringify(Array.from(parsed.entries()))
  }

  if (schema.def.type === 'set') {
    const parsed = schema.parse(value) as Set<unknown>

    return JSON.stringify(Array.from(parsed.values()))
  }

  if (schema.def.type === 'intersection') {
    throw new Error('Intersection schemas are not supported')
  }

  if (schema.def.type === 'promise') {
    throw new Error('Promise schemas are not supported')
  }

  return JSON.stringify(schema.parse(value))
}
