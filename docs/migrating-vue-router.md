# Migrating from vue-router

:white_check_mark: Nested routes mapping  
:white_check_mark: Dynamic Routing  
:white_check_mark: Modular, component-based router configuration  
:white_check_mark: Route params, query, wildcards  
:white_check_mark: View transition effects powered by Vue.js' transition system  
:white_check_mark: Fine-grained navigation control  
:white_check_mark: Links with automatic active CSS classes  
:white_check_mark: HTML5 history mode or hash mode  
:x: Customizable Scroll Behavior  
:white_check_mark: Proper encoding for URLs  

## Child Routes

Child routes in vue-router have very different behavior depending on if the path starts with "/" or not. In Kitbag Router, the behavior is always the same, so add slashes where you want them and leave them off where you don't.

## Route Regex

Kitbag Router support FULL regex pattern matching in both the path and query. The only caveat is that your regex must be encapsulated by a param.

```ts
import { path } from '@kitbag/router'

path('/[pattern]', { pattern: /[\d{2}]-[\d{2}]-[\d{4}]/g })
```

The param will be used to verify any potential matches from the URL, regardless of if you actually use the param value stored on `route.params`.

## Repeatable Params

Kitbag Router DOES support repeatable params like [vue-router](https://router.vuejs.org/guide/essentials/route-matching-syntax.html#Repeatable-params), but the syntax is different.
