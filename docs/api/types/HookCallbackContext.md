# Types: HookCallbackContext\<TContext, TRoutes\>

```ts
type HookCallbackContext<TContext, TRoutes> = object & 
  | Omit<BeforeHookContext<Route, RouteContextToRoute<[...TContext]>, RouteContextToRejection<[...TContext]>>, "update">
| Omit<AfterHookContext<Route, RouteContextToRoute<[...TContext]>, RouteContextToRejection<[...TContext]>>, "update">;
```

Context provided to a reusable hook, narrowed by whether it runs before or after navigation.

## Type Declaration

### from

```ts
from: 
  | ResolvedRouteUnion<TRoutes[number]>
  | null;
```

### update?

```ts
optional update?: RouteUpdate;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TContext` *extends* readonly `RouteContext`[] | \[\] |
| `TRoutes` *extends* `Routes` | `Routes` |
