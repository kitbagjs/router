# @kitbag/router

Type safe router for Vue.js

[![NPM Version][npm-badge]][npm-url]
[![Netlify Status][netlify-badge]][netlify-url]
[![Discord chat][discord-badge]][discord-url]
[![Open in StackBlitz][stackblitz-badge]][stackblitz-url]

<img src="https://kitbag.dev/kitbag-logo.svg" width="20%" />

## Getting Started

Get Started with our [documentation](https://kitbag-router.netlify.app/)

## Installation

```bash
# bun
bun add @kitbag/router
# yarn
yarn add @kitbag/router
# npm
npm install @kitbag/router
```

## Define Basic Routes

Create an array of possible routes. Learn more about [defining routes](https://kitbag-router.netlify.app/core-concepts/defining-routes).

```ts
// /routes.ts
import { createRoute } from '@kitbag/router'

const Home = { template: '<div>Home</div>' }
const About = { template: '<div>About</div>' }

export const routes = [
  createRoute({ name: 'home', path: '/', component: Home }),
  createRoute({ name: 'path', path: '/about', component: About }),
]
```

## Plugin

Create a router instance and pass it to the app as a plugin

```ts
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

This block utilizes [declaration merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html) to provide the internal types to match the actual router you're using. You put this in main.ts right after you call `createRouter`, or you can export your router and put this interface inside of a `router.d.ts` file, anywhere that your tsconfig can find it.

```ts
declare module '@kitbag/router' {
  interface Register {
    router: typeof router
  }
}
```

## Push

To navigate to another route, you can use `router.push`. This method will update the URL for the browser and also add the URL into the history so when a user uses the back button on their browser it will behave as expected.

```ts
import { defineAsyncComponent } from 'vue'
import { createRoute, useRouter } from '@kitbag/router'

const user = createRoute({
  name: 'user',
  path: '/user',
  component: defineAsyncComponent(() => import('./UserPage.vue')),
})

const profile = createRoute({
  parent: user,
  name: 'profile',
  path: '/profile',
  component: defineAsyncComponent(() => import('./ProfilePage.vue')),
})

const settings = createRoute({
  parent: user,
  name: 'settings',
  path: '/settings',
  component: defineAsyncComponent(() => import('./SettingsPage.vue')),
})

const router = useRouter([user, profile, settings])

router.push('user.settings')
```

The push method also accepts a plain string if you know the URL you want to go to.

```ts
router.push('/user/settings')
router.push('https://github.com/kitbagjs/router')
```

This `source` argument is type safe, expecting either a Url or a valid route "key". Url is any string that starts with "http", "https", or a forward slash "/". Route key is a string of route names joined by a period `.`. Additionally if using the route key, push will require params be passed in if there are any.

## Update

If you only wish to change the params on the current route you can use `router.route.update`.

```ts
router.route.update('myParam', 123)
```

or for setting multiple params at once

```ts
router.route.update({
  myParam: 123,
  tab: 'github',
})
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

This component can be mounted anywhere you want route components to be mounted. Nested routes can also have a nested `RouterView` which would be responsible for rendering any children that route may have. Read more about [nested routes](https://kitbag-router.netlify.app/core-concepts/defining-routes#nested-routes).

## RouterLink

Use RouterLink for navigating between routes.

```html {3-4}
<template>
  ...
  <!-- router-link renders as <a> with href -->
  <router-link :to="(resolve) => resolve('home')">Go somewhere</router-link>
</template>
```

This component gives the router the power to change the URL without reloading the page.

[npm-badge]: https://img.shields.io/npm/v/@kitbag/router.svg
[npm-url]: https://www.npmjs.org/package/@kitbag/router
[netlify-badge]: https://api.netlify.com/api/v1/badges/c12f79b8-49f9-4529-bc23-f8ffca8919a3/deploy-status
[netlify-url]: https://app.netlify.com/sites/kitbag-router/deploys
[discord-badge]: https://img.shields.io/discord/1079625926024900739?logo=discord&label=Discord
[discord-url]: https://discord.gg/zw7dpcc5HV
[stackblitz-badge]: https://developer.stackblitz.com/img/open_in_stackblitz_small.svg
[stackblitz-url]: https://stackblitz.com/~/github.com/kitbagjs/router-preview
