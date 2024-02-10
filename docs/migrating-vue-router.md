# Migrating from vue-router

:white_check_mark: Nested routes mapping  
:white_check_mark: Dynamic Routing  
:white_check_mark: Modular, component-based router configuration  
:white_check_mark: Route params, query, wildcards  
:white_check_mark: View transition effects powered by Vue.js' transition system **(todo!)**  
:white_check_mark: Fine-grained navigation control  
:white_check_mark: Links with automatic active CSS classes **(todo!)**  
:x: HTML5 history mode or hash mode  
:white_check_mark: Customizable Scroll Behavior **(todo!)**  
:white_check_mark: Proper encoding for URLs **(todo?)**  

## Child Routes

Child routes in vue-router have very different behavior depending on if the path starts with "/" or not. In Kitbag Router, the behavior is always the same, so add slashes where you want them and leave them off where you don't.

## Route Regex

### Hash History Mode

## Repeatable Params

https://router.vuejs.org/guide/essentials/route-matching-syntax.html#Repeatable-params