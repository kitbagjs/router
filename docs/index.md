---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "Kitbag Router"
  text: "Type safe router for Vue.js"
  image: "/kitbag-logo.svg"
  tagline: Simple, extensible, and developer friendly routing for Vue.js
  actions:
    - theme: brand
      text: Get Started
      link: /show-me
    - theme: alt
      text: Documentation
      link: /core-concepts/defining-routes
    - theme: alt stackblitz
      text: StackBlitz
      link: https://stackblitz.com/~/github.com/kitbagjs/router-preview

features:
  - title: Type Safety
    details: No more magic strings when navigating, accessing params, etc.
  - title: Better Route Params
    details: Params are accessible on route by name, and converted to whatever type you need.
  - title: Support for Query
    details: Rich param support just like path params, including being considered in route matching.
  - title: Rejection Handling
    details: Configure app-wide rejection handling for 404, 401, whatever you need.
---

