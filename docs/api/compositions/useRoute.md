# Compositions: useRoute()

```ts
const useRoute: {
  (): RouterRoute<Readonly<{
  hash: string;
  href: Url;
  id: any;
  matched: any;
  matches: any;
  name: any;
  params: {
   [x: string]: unknown;
   [x: number]: unknown;
   [x: symbol]: unknown;
  };
  query: URLSearchParams;
  state: ExtractRouteStateParamsAsOptional;
}>>;
<TRouteName>  (routeName, options): RouterRoute<Readonly<{
  hash: string;
  href: Url;
  id: any;
  matched: any;
  matches: any;
  name: any;
  params: {
   [x: string]: unknown;
   [x: number]: unknown;
   [x: symbol]: unknown;
  };
  query: URLSearchParams;
  state: ExtractRouteStateParamsAsOptional;
}>> & object;
<TRouteName>  (routeName, options?): RouterRoute<Readonly<{
  hash: string;
  href: Url;
  id: any;
  matched: any;
  matches: any;
  name: any;
  params: {
   [x: string]: unknown;
   [x: number]: unknown;
   [x: symbol]: unknown;
  };
  query: URLSearchParams;
  state: ExtractRouteStateParamsAsOptional;
}>> & object;
};
```

A composition to access the current route or verify a specific route name within a Vue component.
This function provides two overloads:
1. When called without arguments, it returns the current route from the router without types.
2. When called with a route name, it checks if the current active route includes the specified route name.

The function also sets up a reactive watcher on the route object from the router to continually check the validity of the route name
if provided, throwing an error if the validation fails at any point during the component's lifecycle.

## Call Signature

```ts
(): RouterRoute<Readonly<{
  hash: string;
  href: Url;
  id: any;
  matched: any;
  matches: any;
  name: any;
  params: {
   [x: string]: unknown;
   [x: number]: unknown;
   [x: symbol]: unknown;
  };
  query: URLSearchParams;
  state: ExtractRouteStateParamsAsOptional;
}>>;
```

### Returns

[`RouterRoute`](../types/RouterRoute.md)\<`Readonly`\<\{
  `hash`: `string`;
  `href`: [`Url`](../types/Url.md);
  `id`: `any`;
  `matched`: `any`;
  `matches`: `any`;
  `name`: `any`;
  `params`: \{
   [`x`: `string`]: `unknown`;
   [`x`: `number`]: `unknown`;
   [`x`: `symbol`]: `unknown`;
  \};
  `query`: `URLSearchParams`;
  `state`: `ExtractRouteStateParamsAsOptional`;
\}\>\>

## Call Signature

```ts
<TRouteName>(routeName, options): RouterRoute<Readonly<{
  hash: string;
  href: Url;
  id: any;
  matched: any;
  matches: any;
  name: any;
  params: {
   [x: string]: unknown;
   [x: number]: unknown;
   [x: symbol]: unknown;
  };
  query: URLSearchParams;
  state: ExtractRouteStateParamsAsOptional;
}>> & object;
```

### Type Parameters

| Type Parameter |
| ------ |
| `TRouteName` *extends* `unknown` |

### Parameters

| Parameter | Type |
| ------ | ------ |
| `routeName` | `TRouteName` |
| `options` | `IsRouteOptions` & `object` |

### Returns

[`RouterRoute`](../types/RouterRoute.md)\<`Readonly`\<\{
  `hash`: `string`;
  `href`: [`Url`](../types/Url.md);
  `id`: `any`;
  `matched`: `any`;
  `matches`: `any`;
  `name`: `any`;
  `params`: \{
   [`x`: `string`]: `unknown`;
   [`x`: `number`]: `unknown`;
   [`x`: `symbol`]: `unknown`;
  \};
  `query`: `URLSearchParams`;
  `state`: `ExtractRouteStateParamsAsOptional`;
\}\>\> & `object`

## Call Signature

```ts
<TRouteName>(routeName, options?): RouterRoute<Readonly<{
  hash: string;
  href: Url;
  id: any;
  matched: any;
  matches: any;
  name: any;
  params: {
   [x: string]: unknown;
   [x: number]: unknown;
   [x: symbol]: unknown;
  };
  query: URLSearchParams;
  state: ExtractRouteStateParamsAsOptional;
}>> & object;
```

### Type Parameters

| Type Parameter |
| ------ |
| `TRouteName` *extends* `unknown` |

### Parameters

| Parameter | Type |
| ------ | ------ |
| `routeName` | `TRouteName` |
| `options?` | `IsRouteOptions` |

### Returns

[`RouterRoute`](../types/RouterRoute.md)\<`Readonly`\<\{
  `hash`: `string`;
  `href`: [`Url`](../types/Url.md);
  `id`: `any`;
  `matched`: `any`;
  `matches`: `any`;
  `name`: `any`;
  `params`: \{
   [`x`: `string`]: `unknown`;
   [`x`: `number`]: `unknown`;
   [`x`: `symbol`]: `unknown`;
  \};
  `query`: `URLSearchParams`;
  `state`: `ExtractRouteStateParamsAsOptional`;
\}\>\> & `object`

## Template

A string type that should match route name of the registered router, ensuring the route name exists.

## Param

Optional. The name of the route to validate against the current active routes.

## Returns

The current router route. If a route name is provided, it validates the route name first.

## Throws

Throws an error if the provided route name is not valid or does not match the current route.
