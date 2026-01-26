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
import { createRoute } from '@kitbag/router'

const Home = { template: '<div>Home</div>' }
const About = { template: '<div>About</div>' }

const routes = [
  createRoute({ name: 'home', path: '/', component: Home }),
  createRoute({ name: 'path', path: '/about', component: About }),
] as const
```

::: info Type Safety
Using `as const` when defining routes is important as it ensures the types are correctly inferred.
:::

## Create Router

A router is created using the [`createRouter`](/api/functions/createRouter) utility and passing in the routes.

```ts
import { createRouter } from '@kitbag/router'

const router = createRouter(routes)
```

## Vue Plugin

Create a router instance and pass it to the app as a plugin

```ts {6}
import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)

app.use(router)
app.mount('#app')
```

## Type Safety

Kitbag Router utilizes [declaration merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html) to provide the internal types to match the actual router you're using.

```ts
declare module '@kitbag/router' {
  interface Register {
    router: typeof router
  }
}
```

This means then when you import a component, composition, or hook from `@kitbag/router` it will be correctly typed. Alternatively, you can create your own typed router assets by using the [`createRouterAssets`](/api/functions/createRouterAssets) utility. This approach is especially useful for projects that use multiple routers.

## RouterView

Give your route components a place to be mounted

```html
<div class="app">
  <router-view />
</div>
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
