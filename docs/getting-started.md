# Getting Started

## Installation

Install `kitbag/router` with your favorite package manager

```bash
# bun
bun add kitbag/router
# yarn
yarn add kitbag/router
# npm
npm install kitbag/router
```

## Define Basic Routes

Create an array of possible routes. Learn more about [defining routes](/core-concepts/defining-routes).

```js
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

```js {2-3,6,9}
import { createApp } from 'vue'
import { createRouter } from '@kitbag/router'
import { routes } from '/routes'
import App from './App.vue'

const router = createRouter(routes)
const app = createApp(App)

app.use(router)
app.mount('#app')
```

### RouterView

Give your route components a place to be mounted

```html {3-4}
<div id="app">
  ...
  <!-- matched route.component gets rendered here -->
  <router-view />
</div>
```

This component can be mounted anywhere you want route components to be mounted. Nested routes can also have a nested `RouterView` which would be responsible for rendering any children that route may have. See more about [nested routes](/core-concepts/defining-routes#nested-routes).

### RouterLink

Use RouterLink for navigating between routes.

```html {3-4}
<div id="app">
  ...
  <!-- router-link renders as <a> with href -->
  <router-link :to="{ route: 'home' }">Go somewhere</router-link>
</div>
```

This component gives the router the power to change the URL without reloading the page.
