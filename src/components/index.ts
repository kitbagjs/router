import RouterView from '@/components/routerView'

export { RouterView }

declare module '@vue/runtime-core' {
  export interface GlobalComponents {
    RouterView: typeof RouterView,
  }
}
