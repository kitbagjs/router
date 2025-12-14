import { genericRejection } from '@/components/rejection'
import { Rejection } from '@/types/rejection'
import { Component } from 'vue'

export function createRejection<TType extends string>(type: TType, component?: Component): Rejection<TType> {
  return {
    type,
    component: component ?? genericRejection(type),
  }
}
