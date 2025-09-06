import { InjectionKey } from 'vue'
import { RegisteredRouter } from './types/register'

export const routerInjectionKey: InjectionKey<RegisteredRouter> = Symbol()
