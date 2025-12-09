# Compositions: useRoute

```ts
const useRoute: RouterAssets<RegisteredRouter>["useRoute"];
```

A composition to access the current route or verify a specific route name within a Vue component.
This function provides two overloads:
1. When called without arguments, it returns the current route from the router without types.
2. When called with a route name, it checks if the current active route includes the specified route name.

The function also sets up a reactive watcher on the route object from the router to continually check the validity of the route name
if provided, throwing an error if the validation fails at any point during the component's lifecycle.

## Template

A string type that should match route name of the registered router, ensuring the route name exists.

## Param

Optional. The name of the route to validate against the current active routes.

## Returns

The current router route. If a route name is provided, it validates the route name first.

## Throws

Throws an error if the provided route name is not valid or does not match the current route.
