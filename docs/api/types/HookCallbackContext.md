# Types: HookCallbackContext\<TContext, TRoutes\>

```ts
type HookCallbackContext<TContext, TRoutes> = object & (
  | Omit<BeforeHookContext<Route, RouteContextToRoute<[...TContext]>, RouteContextToRejection<[...TContext]>>, "update">
  | Omit<AfterHookContext<Route, RouteContextToRoute<[...TContext]>, RouteContextToRejection<[...TContext]>>, "update">);
```

Context provided to a reusable hook, narrowed by whether it runs before or after navigation.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tcontext"></a> `TContext` *extends* readonly `RouteContext`[] | \[\] |
| <a id="type-parameter-troutes"></a> `TRoutes` *extends* `Routes` | `Routes` |

## Type Declaration

### from

```ts
from: 
  | ResolvedRouteUnion<TRoutes[number]>
  | null;
```

### update?

```ts
update?: RouteUpdate;
```
