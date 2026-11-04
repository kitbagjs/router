import { createPropsComputation } from '@/services/createPropsComputation'
import { createLoaderComputation } from '@/services/createLoaderComputation'
import { Computation, CreateRouteComputationOptions } from '@/types/computation'

export function createRouteComputation(options: CreateRouteComputationOptions): Computation {
  const { kind } = options.location

  switch (kind) {
    case 'props':
      return createPropsComputation(options)
    case 'loader':
      return createLoaderComputation(options)
    default: {
      const exhaustive: never = kind
      throw new Error(`Unknown computation kind: ${exhaustive}`)
    }
  }
}
