# Compositions: useRoute()

## Call Signature

```ts
function useRoute(): RouterRoute
```

A composition to access the current route or verify a specific route name within a Vue component.
This function provides two overloads:
1. When called without arguments, it returns the current route from the router without types.
2. When called with a route name, it checks if the current active route includes the specified route name.

The function also sets up a reactive watcher on the route object from the router to continually check the validity of the route name
if provided, throwing an error if the validation fails at any point during the component's lifecycle.

### Returns

[`RouterRoute`](../types/RouterRoute.md)

The current router route. If a route name is provided, it validates the route name first.

### Throws

Throws an error if the provided route name is not valid or does not match the current route.

## Call Signature

```ts
function useRoute<TRouteName>(routeName, options): RouterRoute<Readonly<{
  hash: string;
  href: Url;
  id: any;
  matched: any;
  matches: any;
  name: any;
  params: {};
  query: URLSearchParams;
  state: ExtractRouteStateParamsAsOptional<any>;
 }>> & object
```

A composition to access the current route or verify a specific route name within a Vue component.
This function provides two overloads:
1. When called without arguments, it returns the current route from the router without types.
2. When called with a route name, it checks if the current active route includes the specified route name.

The function also sets up a reactive watcher on the route object from the router to continually check the validity of the route name
if provided, throwing an error if the validation fails at any point during the component's lifecycle.

### Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `TRouteName` *extends* `string` | A string type that should match route name of RegisteredRouteMap, ensuring the route name exists. |

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `routeName` | `TRouteName` | Optional. The name of the route to validate against the current active routes. |
| `options` | `IsRouteOptions` & `object` | - |

### Returns

[`RouterRoute`](../types/RouterRoute.md)\<`Readonly`\<\{
  `hash`: `string`;
  `href`: [`Url`](../types/Url.md);
  `id`: `any`;
  `matched`: `any`;
  `matches`: `any`;
  `name`: `any`;
  `params`: \{\};
  `query`: `URLSearchParams`;
  `state`: `ExtractRouteStateParamsAsOptional`\<`any`\>;
 \}\>\> & `object`

The current router route. If a route name is provided, it validates the route name first.

### Throws

Throws an error if the provided route name is not valid or does not match the current route.

## Call Signature

```ts
function useRoute<TRouteName>(routeName, options?): RouterRoute<Readonly<{
  hash: string;
  href: Url;
  id: any;
  matched: any;
  matches: any;
  name: any;
  params: {};
  query: URLSearchParams;
  state: ExtractRouteStateParamsAsOptional<any>;
 }>> & object
```

A composition to access the current route or verify a specific route name within a Vue component.
This function provides two overloads:
1. When called without arguments, it returns the current route from the router without types.
2. When called with a route name, it checks if the current active route includes the specified route name.

The function also sets up a reactive watcher on the route object from the router to continually check the validity of the route name
if provided, throwing an error if the validation fails at any point during the component's lifecycle.

### Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `TRouteName` *extends* `string` | A string type that should match route name of RegisteredRouteMap, ensuring the route name exists. |

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `routeName` | `TRouteName` | Optional. The name of the route to validate against the current active routes. |
| `options`? | `IsRouteOptions` | - |

### Returns

[`RouterRoute`](../types/RouterRoute.md)\<`Readonly`\<\{
  `hash`: `string`;
  `href`: [`Url`](../types/Url.md);
  `id`: `any`;
  `matched`: `any`;
  `matches`: `any`;
  `name`: `any`;
  `params`: \{\};
  `query`: `URLSearchParams`;
  `state`: `ExtractRouteStateParamsAsOptional`\<`any`\>;
 \}\>\> & `object`

The current router route. If a route name is provided, it validates the route name first.

### Throws

Throws an error if the provided route name is not valid or does not match the current route.
