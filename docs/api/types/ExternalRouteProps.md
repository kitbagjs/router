# ExternalRouteProps

Unifies the properties of both parent and child routes, ensuring type safety and consistency across route configurations.

## ExternalRouteParentProps

Represents properties common to parent routes in a route configuration, including hooks, path, and optional query parameters.

### name

Name for route, used to create route keys and in navigation. Read more about [route naming](/core-concepts/defining-routes#route-names).

```ts
name: string | undefined;
```

### host

Host part of URL. If value is provided as `string`, assumes any params will be `string`. See [Host](/api/functions/host).

```ts
host?: : string | Host | undefined;
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

Children routes, expected type comes from [createExternalRoutes()](/api/functions/createExternalRoutes). Read more about [nesting routes](/core-concepts/defining-routes#nested-routes).

```ts
children: ExternalChildRoutes;
```

## ExternalRouteChildProps

Represents properties for child routes, has same properties as ExternalRouteParentProps except `name` is no longer optional.
