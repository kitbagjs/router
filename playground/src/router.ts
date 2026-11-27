import { defineAsyncComponent } from 'vue'
import { createRoute, createRouter, createRouterAssets, ViewTransitionContext } from '@kitbag/router'
import { sleep } from './sleep'
import Home from './pages/Home.vue'
import SyncProps from './pages/SyncProps.vue'
import AsyncProps from './pages/AsyncProps.vue'
import Loader from './pages/Loader.vue'
import Plain from './pages/Plain.vue'
import Gallery from './pages/Gallery.vue'
import Photo from './pages/Photo.vue'
import Nested from './pages/Nested.vue'
import NestedChild from './pages/NestedChild.vue'
import Everything from './pages/Everything.vue'

export const photos = ['#f97316', '#84cc16', '#06b6d4', '#a855f7', '#f43f5e', '#eab308']

const home = createRoute({ name: 'home', path: '/', component: Home })

const syncProps = createRoute({ name: 'syncProps', path: '/sync-props' })
  .addView(SyncProps, {
    props: () => ({ message: 'These props were computed synchronously' }),
  })

const asyncProps = createRoute({ name: 'asyncProps', path: '/async-props/[id]' })
  .addView(AsyncProps, {
    props: async (route) => {
      await sleep(800)

      return { id: route.params.id, loadedAt: new Date().toLocaleTimeString() }
    },
  })

const asyncComponent = createRoute({
  name: 'asyncComponent',
  path: '/async-component',
  component: defineAsyncComponent(async () => {
    await sleep(1000)

    return import('./pages/AsyncComponent.vue')
  }),
})

const loader = createRoute({ name: 'loader', path: '/loader', component: Loader })
  .addLoader(async () => {
    await sleep(600)

    return ['alpha', 'beta', 'gamma', 'delta'].map((name) => `${name} loaded at ${new Date().toLocaleTimeString()}`)
  })

const everything = createRoute({
  name: 'everything',
  path: '/everything',
})
  .addView(defineAsyncComponent(async () => {
    await sleep(500)

    return Everything
  }), {
    props: async () => {
      await sleep(400)

      return { propsLoadedAt: new Date().toLocaleTimeString() }
    },
  })
  .addLoader(async () => {
    await sleep(900)

    return `loader finished at ${new Date().toLocaleTimeString()}`
  })

const plain = createRoute({ name: 'plain', path: '/plain', component: Plain, viewTransition: false })

const gallery = createRoute({ name: 'gallery', path: '/gallery', component: Gallery })

const photo = createRoute({ name: 'photo', path: '/gallery/[id]', component: Photo })

const nested = createRoute({ name: 'nested', path: '/nested', component: Nested })

const nestedChild = createRoute({
  parent: nested,
  name: 'nestedChild',
  path: '/[which]',
  viewTransition: ['fade-up'],
})
  .addView(NestedChild, {
    props: async (route) => {
      await sleep(300)

      return { which: route.params.which }
    },
  })

export const routes = [
  home,
  syncProps,
  asyncProps,
  asyncComponent,
  loader,
  everything,
  plain,
  gallery,
  photo,
  nested,
  nestedChild,
] as const

/**
 * The order of the top level pages in the nav, used to slide left or right depending on direction.
 */
export const order = ['home', 'syncProps', 'asyncProps', 'asyncComponent', 'loader', 'everything', 'plain', 'gallery', 'nested']

export const router = createRouter(routes, {
  viewTransition: {
    types: ({ to, from }: ViewTransitionContext) => {
      const direction = order.indexOf(String(to.matches[0].name)) - order.indexOf(String(from.matches[0].name))

      if (direction > 0) {
        return ['slide-left']
      }

      if (direction < 0) {
        return ['slide-right']
      }

      return []
    },
  },
})

export const { RouterLink, RouterView, useRoute, useViewTransition } = createRouterAssets(router)
