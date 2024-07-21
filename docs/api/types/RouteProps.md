# RouteProps

Unifies the properties of both parent and child routes, ensuring type safety and consistency across route configurations.

## ParentRouteProps

Represents properties common to parent routes in a route configuration, including hooks, path, and optional query parameters.

### name

Name for route, used to create route keys and in navigation. Read more about [route naming](/core-concepts/defining-routes#route-names).

```ts
name: string | undefined;
```

### path

Path part of URL. If value is provided as `string`, assumes any params will be `string`. See [Path](/api/functions/path).

```ts
path?: : string | Path | undefined;
```

### query

Query (aka search) part of URL. If value is provided as `string`, assumes any params will be `string`. See [Query](/api/functions/query).

```ts
query: string | Query | undefined;
```

### disabled

Disabled routes will not ever match but can still provide physical structure, nested children behave normally.

```ts
disabled: boolean | undefined;
```

### children

Children routes, expected type comes from [createRoutes()](/api/functions/createRoutes). Read more about [nesting routes](/core-concepts/defining-routes#nested-routes).

```ts
children: Routes;
```

### component

Vue component, which can be either synchronous or asynchronous components.

```ts
component: Component | undefined;
```

### meta

Represents additional metadata associated with a route, customizable via declaration merging. Read more about [route meta](/api/interfaces/RouteMeta).

```ts
meta: RouteMeta | undefined;
```

## ChildRouteProps

Represents properties for child routes, has same properties as ParentRouteProps except `name` and `component` are no longer optional. Routes must provide either `children`, or satisfy `ChildRouteProps`.

```ts
type ChildRouteProps = WithHooks & {
  name: string,
  disabled?: boolean,
  path: string | Path,
  query?: string | Query,
  component: Component,
  meta?: RouteMeta,
}
```

## WithHooks

Defines route hooks that can be applied before entering, updating, or leaving a route, as well as after these events.

```ts
type WithHooks = {
  onBeforeRouteEnter?: MaybeArray<BeforeRouteHook>,
  onBeforeRouteUpdate?: MaybeArray<BeforeRouteHook>,
  onBeforeRouteLeave?: MaybeArray<BeforeRouteHook>,
  onAfterRouteEnter?: MaybeArray<AfterRouteHook>,
  onAfterRouteUpdate?: MaybeArray<AfterRouteHook>,
  onAfterRouteLeave?: MaybeArray<AfterRouteHook>,
}
```
