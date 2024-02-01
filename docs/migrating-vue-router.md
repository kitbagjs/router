# Migrating from vue-router

## Child Routes

Child routes in vue-router have very different behavior depending on if the path starts with "/" or not. In kitbag/router, the behavior is always the same, so add slashes where you want them and leave them off where you don't.

## Repeatable Params

https://router.vuejs.org/guide/essentials/route-matching-syntax.html#Repeatable-params