import { genericRejection } from '@/components/rejection'
import { Rejection } from '@/types/rejection'
import { Component } from 'vue'

export function createRejection<TType extends string>(options: {
  type: TType, component?: Component,
}): Rejection<TType> {
  const component = options.component ?? genericRejection(options.type)

  return {
    type: options.type,
    component,
  }
}
