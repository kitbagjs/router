# @kitbag/router

A simple and versatile mapping utility for Typescript.

[![Npm Version](https://img.shields.io/npm/v/@kitbag/router.svg)](https://www.npmjs.org/package/kitbag/router)
[![Zip Size](https://img.badgesize.io/https:/unpkg.com/@kitbag/router/dist/kitbag-router?compression=gzip)](https:/unpkg.com/@kitbag/router/dist/kitbag-router)
[![Netlify Status](https://api.netlify.com/api/v1/badges/d6033c76-88c3-4963-b24f-7a0bda20f271/deploy-status)](https://app.netlify.com/sites/kitbag-router/deploys)

Get started with the [documentation](https://kitbag-router.netlify.app/)

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

Create an array of possible routes. Learn more about [defining routes](https://kitbag-router.netlify.app/core-concepts/defining-routes).

```ts
// /routes.ts
import { Routes } from '@kitbag/router'

const Home = { template: '<div>Home</div>' }
const About = { template: '<div>About</div>' }

export const routes = [
  { name: 'home', path: '/', component: Home },
  { name: 'path', path: '/about', component: About },
] as const satisfies Routes 
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

This component can be mounted anywhere you want route components to be mounted. Nested routes can also have a nested `RouterView` which would be responsible for rendering any children that route may have. See more about [nested routes](https://kitbag-router.netlify.app/core-concepts/defining-routes#nested-routes).

## RouterLink

Use RouterLink for navigating between routes.

```html {3-4}
<template>
  ...
  <!-- router-link renders as <a> with href -->
  <router-link :to="{ route: 'home' }">Go somewhere</router-link>
</template>
```

This component gives the router the power to change the URL without reloading the page.
