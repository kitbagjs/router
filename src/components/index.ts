import RouterView from '@/components/RouterView.vue'

export { RouterView }

declare module '@vue/runtime-core' {
  export interface GlobalComponents {
    RouterView: typeof RouterView,
  }
}
