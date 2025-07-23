# Quick Start

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

## Define Routes

Routes are created individually using the [`createRoute`](/api/functions/createRoute) utility. Learn more about [defining routes](/core-concepts/routes).

```ts
// routes.ts
import { createRoute } from '@kitbag/router'
import Home from './components/Home.vue'
import About from './components/About.vue'

const routes = [
  createRoute({ name: 'home', path: '/', component: Home }),
  createRoute({ name: 'about', path: '/about', component: About }),
] as const

export { routes }
```

::: info Type Safety
Using `as const` when defining routes is important as it ensures the types are correctly inferred.
:::

## Create Router

A router is created using the [`createRouter`](/api/functions/createRouter) utility and passing in the routes.

```ts
// router.ts
import { createRouter } from '@kitbag/router'
import { routes } from './routes'

const router = createRouter(routes)

export { router }
```

## Vue Plugin

Create a router instance and pass it to the app as a plugin

```ts
// main.ts
import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'

const app = createApp(App)

app.use(router)
app.mount('#app')
```

## Type Safety

Kitbag Router utilizes [declaration merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html) to provide the internal types to match the actual router you're using. Add this to your router file:

```ts
// router.ts
import { createRouter } from '@kitbag/router'
import { routes } from './routes'

const router = createRouter(routes)

// Enable type safety
declare module '@kitbag/router' {
  interface Register {
    router: typeof router
  }
}

export { router }
```

## RouterView

Give your route components a place to be mounted in your main App component:

```vue
<!-- App.vue -->
<template>
  <div class="app">
    <nav>
      <router-link :to="(resolve) => resolve('home')">Home</router-link>
      <router-link :to="(resolve) => resolve('about')">About</router-link>
    </nav>
    
    <main>
      <router-view />
    </main>
  </div>
</template>
```

This component can be mounted anywhere you want route components to be mounted. Nested routes can also have a nested `RouterView` which would be responsible for rendering any children that route may have. Read more about [nested routes](/core-concepts/routes#parent).

## RouterLink

Use RouterLink for navigating between routes.

```html
<template>
  <router-link :to="(resolve) => resolve('home')">Home</router-link>
</template>
```

### Type Safety in RouterLink

The `to` prop accepts a callback function or a [`Url`](/api/types/Url) string. When using a callback function, the router will provide a `resolve` function that is a type safe way to create link for your pre-defined routes.
