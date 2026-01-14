import { Param, ParamGetSet } from '@/types/paramTypes'
import { Routes } from '@/types/route'
import { isRecord } from '@/utilities/guards'
import { StandardSchemaV1 } from '@standard-schema/spec'
import { type ZodType } from 'zod'

export interface ZodSchemaLike extends StandardSchemaV1<any> {
  parse: (input: any) => any,
}

let zod: ZodSchemas | null = null

// inferring the return type is preferred for this function
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
async function getZodInstances() {
  const {
    ZodType,
    ZodString,
    ZodIPv4,
    ZodIPv6,
    ZodCIDRv4,
    ZodCIDRv6,
    ZodURL,
    ZodEmail,
    ZodUUID,
    ZodBase64,
    ZodCUID,
    ZodCUID2,
    ZodULID,
    ZodJWT,
    ZodBigInt,
    ZodNaN,
    ZodBoolean,
    ZodDate,
    ZodISODateTime,
    ZodISODate,
    ZodISOTime,
    ZodNumber,
    ZodLiteral,
    ZodObject,
    ZodEnum,
    ZodArray,
    ZodTuple,
    ZodUnion,
    ZodDiscriminatedUnion,
    ZodRecord,
    ZodMap,
    ZodSet,
    ZodIntersection,
    ZodPromise,
  } = await import('zod')

  return {
    ZodType,
    ZodString,
    ZodIPv4,
    ZodIPv6,
    ZodCIDRv4,
    ZodCIDRv6,
    ZodURL,
    ZodEmail,
    ZodUUID,
    ZodBase64,
    ZodCUID,
    ZodCUID2,
    ZodULID,
    ZodJWT,
    ZodBigInt,
    ZodNaN,
    ZodBoolean,
    ZodDate,
    ZodISODateTime,
    ZodISODate,
    ZodISOTime,
    ZodNumber,
    ZodLiteral,
    ZodObject,
    ZodEnum,
    ZodArray,
    ZodTuple,
    ZodUnion,
    ZodDiscriminatedUnion,
    ZodRecord,
    ZodMap,
    ZodSet,
    ZodIntersection,
    ZodPromise,
  }
}

type ZodSchemas = Awaited<ReturnType<typeof getZodInstances>>

export function zotParamsDetected(routes: Routes): boolean {
  return Object.values(routes).some((route) => {
    return Object.values(route.host.schema.params).some((param) => isZodSchemaLike(param))
      || Object.values(route.path.schema.params).some((param) => isZodSchemaLike(param))
      || Object.values(route.query.schema.params).some((param) => isZodSchemaLike(param))
  })
}

function isZodSchemaLike(param: Param): param is ZodSchemaLike {
  return isRecord(param)
    && 'parse' in param
    && typeof param.parse === 'function'
    && '~standard' in param
    && isRecord(param['~standard'])
    && 'vendor' in param['~standard']
    && param['~standard'].vendor === 'zod'
}

export async function initZod(): Promise<void> {
  try {
    zod = await getZodInstances()
  } catch {
    throw new Error('Failed to initialize Zod')
  }
}

export function isZodParam(value: unknown): value is ZodType {
  if (!zod) {
    return false
  }

  return value instanceof zod.ZodType
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
  return zod?.ZodString && schemaA instanceof zod.ZodString ? 1 : zod?.ZodString && schemaB instanceof zod.ZodString ? -1 : 0
}

function parseZodValue(value: string, schema: ZodType): unknown {
  if (!zod) {
    throw new Error('Zod is not initialized')
  }

  if (schema instanceof zod.ZodString) {
    return schema.parse(value)
  }

  if (schema instanceof zod.ZodBoolean) {
    return schema.parse(Boolean(value))
  }

  if (schema instanceof zod.ZodDate) {
    return schema.parse(new Date(value))
  }

  if (schema instanceof zod.ZodNumber) {
    return schema.parse(Number(value))
  }

  if (schema instanceof zod.ZodBigInt) {
    return schema.parse(BigInt(value))
  }

  if (schema instanceof zod.ZodNaN) {
    return schema.parse(Number(value))
  }

  if (schema instanceof zod.ZodLiteral) {
    return tryAll([
      () => schema.parse(Number(value)),
      () => schema.parse(Boolean(value)),
      () => schema.parse(value),
    ])
  }

  if (schema instanceof zod.ZodObject) {
    return schema.parse(JSON.parse(value, reviver))
  }

  if (schema instanceof zod.ZodEnum) {
    return schema.parse(value)
  }

  if (schema instanceof zod.ZodArray) {
    return schema.parse(JSON.parse(value, reviver))
  }

  if (schema instanceof zod.ZodTuple) {
    return schema.parse(JSON.parse(value, reviver))
  }

  if (schema instanceof zod.ZodUnion) {
    const schemas = Array
      .from(schema.def.options as ZodType[])
      .sort(sortZodSchemas)
      .map((schema: ZodType) => () => parseZodValue(value, schema))

    return tryAll(schemas)
  }

  if (schema instanceof zod.ZodDiscriminatedUnion) {
    const schemas = Array
      .from(schema.options as ZodType[])
      .sort(sortZodSchemas)
      .map((schema: ZodType) => () => parseZodValue(value, schema))

    return tryAll(schemas)
  }

  if (schema instanceof zod.ZodRecord) {
    return schema.parse(JSON.parse(value, reviver))
  }

  if (schema instanceof zod.ZodMap) {
    return schema.parse(new Map(JSON.parse(value, reviver)))
  }

  if (schema instanceof zod.ZodSet) {
    return schema.parse(new Set(JSON.parse(value, reviver)))
  }

  if (schema instanceof zod.ZodIntersection) {
    throw new Error('Intersection schemas are not supported')
  }

  if (schema instanceof zod.ZodPromise) {
    throw new Error('Promise schemas are not supported')
  }

  return schema.parse(value)
}

function stringifyZodValue(value: unknown, schema: ZodType): string {
  if (!zod) {
    throw new Error('Zod is not initialized')
  }

  if (schema instanceof zod.ZodString) {
    return schema.parse(value)
  }

  if (schema instanceof zod.ZodISODateTime) {
    return schema.parse(value)
  }

  if (schema instanceof zod.ZodISODate) {
    return schema.parse(value)
  }

  if (schema instanceof zod.ZodISOTime) {
    return schema.parse(value)
  }

  if (schema instanceof zod.ZodIPv4) {
    return schema.parse(value)
  }

  if (schema instanceof zod.ZodIPv6) {
    return schema.parse(value)
  }

  if (schema instanceof zod.ZodCIDRv4) {
    return schema.parse(value)
  }

  if (schema instanceof zod.ZodCIDRv6) {
    return schema.parse(value)
  }

  if (schema instanceof zod.ZodURL) {
    return schema.parse(value)
  }

  if (schema instanceof zod.ZodEmail) {
    return schema.parse(value)
  }

  if (schema instanceof zod.ZodUUID) {
    return schema.parse(value)
  }

  if (schema instanceof zod.ZodBase64) {
    return schema.parse(value)
  }

  if (schema instanceof zod.ZodCUID) {
    return schema.parse(value)
  }

  if (schema instanceof zod.ZodCUID2) {
    return schema.parse(value)
  }

  if (schema instanceof zod.ZodULID) {
    return schema.parse(value)
  }

  if (schema instanceof zod.ZodJWT) {
    return schema.parse(value)
  }

  if (schema instanceof zod.ZodBoolean) {
    return schema.parse(value).toString()
  }

  if (schema instanceof zod.ZodDate) {
    return schema.parse(value).toISOString()
  }

  if (schema instanceof zod.ZodNumber) {
    return schema.parse(Number(value)).toString()
  }

  if (schema instanceof zod.ZodBigInt) {
    return schema.parse(BigInt(String(value))).toString()
  }

  if (schema instanceof zod.ZodNaN) {
    return schema.parse(value).toString()
  }

  if (schema instanceof zod.ZodLiteral) {
    const parsed = schema.parse(value)
    return parsed != null ? parsed.toString() : String(parsed)
  }

  if (schema instanceof zod.ZodObject) {
    return JSON.stringify(schema.parse(value))
  }

  if (schema instanceof zod.ZodEnum) {
    const parsed = schema.parse(value)
    return typeof parsed === 'string' ? parsed : String(parsed)
  }

  if (schema instanceof zod.ZodArray) {
    return JSON.stringify(schema.parse(value))
  }

  if (schema instanceof zod.ZodTuple) {
    return JSON.stringify(schema.parse(value))
  }

  if (schema instanceof zod.ZodUnion) {
    const schemas = Array
      .from(schema.def.options as ZodType[])
      .sort(sortZodSchemas)
      .map((schema: ZodType) => () => stringifyZodValue(value, schema))

    return tryAll(schemas)
  }

  if (schema instanceof zod.ZodDiscriminatedUnion) {
    const schemas = Array
      .from(schema.options as ZodType[])
      .sort(sortZodSchemas)
      .map((schema: ZodType) => () => stringifyZodValue(value, schema))

    return tryAll(schemas)
  }

  if (schema instanceof zod.ZodRecord) {
    return JSON.stringify(schema.parse(value))
  }

  if (schema instanceof zod.ZodMap) {
    const parsed = schema.parse(value)

    return JSON.stringify(Array.from(parsed.entries()))
  }

  if (schema instanceof zod.ZodSet) {
    const parsed = schema.parse(value)

    return JSON.stringify(Array.from(parsed.values()))
  }

  if (schema instanceof zod.ZodIntersection) {
    throw new Error('Intersection schemas are not supported')
  }

  if (schema instanceof zod.ZodPromise) {
    throw new Error('Promise schemas are not supported')
  }

  return JSON.stringify(schema.parse(value))
}
