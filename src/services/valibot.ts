/* eslint-disable @typescript-eslint/only-throw-error */
import { Param, ParamGetSet } from '@/types/paramTypes'
import { isRecord } from '@/utilities/guards'
import { isPromise } from '@/utilities/promises'
import { StandardSchemaV1 } from '@standard-schema/spec'

export interface ValibotSchemaLike extends StandardSchemaV1<any> {
  type: string;
}

// inferring the return type is preferred for this function
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function parse(schema: ValibotSchemaLike, value: unknown) {
  const result = schema['~standard'].validate(value)

  if (isPromise(result)) {
    throw new Error('Promise schemas are not supported')
  }

  if (result.issues) {
    throw new Error('Validation failed')
  }

  return result.value
}

function isValibotSchemaLike(param: Param): param is ValibotSchemaLike {
  return isRecord(param)
    && 'type' in param
    && typeof param.type === 'string'
    && '~standard' in param
    && isRecord(param['~standard'])
    && 'vendor' in param['~standard']
    && param['~standard'].vendor === 'valibot'
}

export function isValibotParam(value: Param): value is ValibotSchemaLike {
  return isValibotSchemaLike(value)
}

export function createValibotParam<T>(schema: ValibotSchemaLike): ParamGetSet<T> {
  return {
    get: (value, { invalid }) => {
      try {
        return parseValibotValue(value, schema) as T
      } catch {
        throw invalid()
      }
    },
    set: (value, { invalid }) => {
      try {
        return stringifyValibotValue(value, schema)
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
function sortValibotSchemas(schemaA: ValibotSchemaLike, schemaB: ValibotSchemaLike): number {
  return schemaA.type === 'string' ? 1 : schemaB.type === 'string' ? -1 : 0
}

function parseValibotValue(value: string, schema: ValibotSchemaLike): unknown {
  if (schema.type === 'boolean') {
    return parse(schema, Boolean(value))
  }

  if (schema.type === 'date') {
    return parse(schema, new Date(value))
  }

  if (schema.type === 'number') {
    return parse(schema, Number(value))
  }

  if (schema.type === 'literal') {
    return tryAll([
      () => parse(schema, Number(value)),
      () => parse(schema, Boolean(value)),
      () => parse(schema, value),
    ])
  }

  if (schema.type === 'object') {
    return parse(schema, JSON.parse(value, reviver))
  }

  if (schema.type === 'enum') {
    return tryAll([
      () => parse(schema, Number(value)),
      () => parse(schema, Boolean(value)),
      () => parse(schema, value),
    ])
  }

  if (schema.type === 'array') {
    return parse(schema, JSON.parse(value, reviver))
  }

  if (schema.type === 'tuple') {
    return parse(schema, JSON.parse(value, reviver))
  }

  if (schema.type === 'union' && 'options' in schema) {
    const schemas = (schema.options as ValibotSchemaLike[])
      .sort(sortValibotSchemas)
      .map((schema) => () => parseValibotValue(value, schema))

    return tryAll(schemas)
  }

  if (schema.type === 'variant' && 'options' in schema) {
    const schemas = (schema.options as ValibotSchemaLike[])
      .sort(sortValibotSchemas)
      .map((schema) => () => parseValibotValue(value, schema))

    return tryAll(schemas)
  }

  if (schema.type === 'record') {
    return parse(schema, JSON.parse(value, reviver))
  }

  if (schema.type === 'map') {
    return parse(schema, new Map(JSON.parse(value, reviver)))
  }

  if (schema.type === 'set') {
    return parse(schema, new Set(JSON.parse(value, reviver)))
  }

  if (schema.type === 'intersection') {
    throw new Error('Intersection schemas are not supported')
  }

  if (schema.type === 'promise') {
    throw new Error('Promise schemas are not supported')
  }

  if (schema.type === 'function') {
    throw new Error('Function schemas are not supported')
  }

  return parse(schema, value)
}

function stringifyValibotValue(value: unknown, schema: ValibotSchemaLike): string {
  if (schema.type === 'string') {
    return parse(schema, value).toString()
  }

  if (schema.type === 'boolean') {
    return parse(schema, value).toString()
  }

  if (schema.type === 'date') {
    return parse(schema, value).toISOString()
  }

  if (schema.type === 'number') {
    return parse(schema, Number(value)).toString()
  }

  if (schema.type === 'literal') {
    return parse(schema, value).toString()
  }

  if (schema.type === 'object') {
    return JSON.stringify(parse(schema, value))
  }

  if (schema.type === 'enum') {
    return parse(schema, value).toString()
  }

  if (schema.type === 'nativeEnum') {
    return parse(schema, value).toString()
  }

  if (schema.type === 'array') {
    return JSON.stringify(parse(schema, value))
  }

  if (schema.type === 'tuple') {
    return JSON.stringify(parse(schema, value))
  }

  if (schema.type === 'union' && 'options' in schema) {
    const schemas = (schema.options as ValibotSchemaLike[])
      .sort(sortValibotSchemas)
      .map((schema) => () => stringifyValibotValue(value, schema))

    return tryAll(schemas)
  }

  if (schema.type === 'variant' && 'options' in schema) {
    const schemas = (schema.options as ValibotSchemaLike[])
      .sort(sortValibotSchemas)
      .map((schema) => () => stringifyValibotValue(value, schema))

    return tryAll(schemas)
  }

  if (schema.type === 'record') {
    return JSON.stringify(parse(schema, value))
  }

  if (schema.type === 'map') {
    const parsed = parse(schema, value)

    return JSON.stringify(Array.from(parsed.entries()))
  }

  if (schema.type === 'set') {
    const parsed = parse(schema, value)

    return JSON.stringify(Array.from(parsed.values()))
  }

  if (schema.type === 'intersection') {
    throw new Error('Intersection schemas are not supported')
  }

  if (schema.type === 'promise') {
    throw new Error('Promise schemas are not supported')
  }

  if (schema.type === 'function') {
    throw new Error('Function schemas are not supported')
  }

  return JSON.stringify(parse(schema, value))
}
