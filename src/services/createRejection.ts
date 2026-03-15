import { createRejectionHooks } from '@/services/createRejectionHooks'
import { genericRejection } from '@/components/rejection'
import { RejectionHooks, WithHooks } from '@/types/hooks'
import { Rejection } from '@/types/rejection'
import { Component } from 'vue'

export function createRejection<TType extends string>(options: { 
  type: TType, 
  component?: Component, 
}): Rejection<TType> & RejectionHooks<TType>

export function createRejection(options: { type: string, component?: Component }): Rejection & RejectionHooks {  
  const component = options.component ?? genericRejection(options.type)

  const { store, ...hooks } = createRejectionHooks()

  const rejection = {
    type: options.type,
    hooks: [store],
    component,
    ...hooks,
  } satisfies Rejection & WithHooks & RejectionHooks

  return rejection
}
