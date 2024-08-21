# Getting Started

## Installation

Install Kitbag Router with your favorite package manager

```bash
# bun
bun add @kitbag/router
# yarn
yarn add @kitbag/router
# npm
npm install @kitbag/router
```

## Define Basic Routes

Routes are created individually using the `createRoute` utility. Learn more about [defining routes](/core-concepts/defining-routes).

::: code-group

```ts [routes.ts]
import { createRoute } from '@kitbag/router'

const Home = { template: '<div>Home</div>' }
const About = { template: '<div>About</div>' }

export const routes = [
  createRoute({ name: 'home', path: '/', component: Home }),
  createRoute({ name: 'path', path: '/about', component: About }),
]
```

:::

## Plugin

Create a router instance and pass it to the app as a plugin

```ts {2-3,6,9}
import { createApp } from 'vue'
import { createRouter } from '@kitbag/router'
import { routes } from '/routes'
import App from './App.vue'

const router = createRouter(routes)
const app = createApp(App)

app.use(router)
app.mount('#app')
```

## Update Registered Router

This block utilizes [declaration merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html) to provide the internal types to match the actual router you're using.
You put this in _main.ts_ right after you call `createRouter`:

```ts
declare module '@kitbag/router' {
  interface Register {
    router: typeof router
  }
}
```

If you call `createRouter` in another module and export `router`, you can put this interface inside a `router.d.ts` file, anywhere that your tsconfig can find it.

```ts
import { router } from './routes'

declare module '@kitbag/router' {
  export interface Register {
    router: typeof router
  }
}

```

## RouterView

Give your route components a place to be mounted

```html {4-5}
<!-- App.vue -->
<div class="app">
  ...
  <!-- matched route.component gets rendered here -->
  <router-view />
</div>
```

This component can be mounted anywhere you want route components to be mounted. Nested routes can also have a nested `RouterView` which would be responsible for rendering any children that route may have. Read more about [nested routes](/core-concepts/defining-routes#nested-routes).

## RouterLink

Use RouterLink for navigating between routes.

```html {3-4}
<template>
  ...
  <!-- router-link renders as <a> with href -->
  <router-link to="/">Go somewhere</router-link>
</template>
```

This component gives the router the power to change the URL without reloading the page.

### Type Safety in RouterLink

Rather than constructing your own URLs for the `to` prop, you can use the callback syntax which provides `router.resolve`. This gives you full type safety by suggesting all available route keys for you as well as prompt for any params that may be required.

```html
<router-link :to="(resolve) => resolve('home')">Go somewhere</router-link>
```
