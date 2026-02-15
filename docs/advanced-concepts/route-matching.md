# Route Matching

There are several rules Kitbag Router uses to determine which of your routes corresponds to the current URL.

## Named

Routes without a [name](/core-concepts/routes#name) property cannot be matched.

## External Routes

If a route is defined as [external](/core-concepts/external-routes), it will only be matched when the url is also external.

## Depth

A route’s depth is determined by the number of parent routes it has. The deeper the route, the higher the priority it has when matching.

```ts
const external = createExternalRoute({
  name: 'external',
  host: 'https://kitbag.dev',
  path: '/about-us'
})
```

:white_check_mark: `https://kitbag.dev/about-us`  
:x: `https://example.com/about-us`  
:x: `/about-us`  

## Path Matches

Routes `path` must match the structure of the URL pathname.

```ts
const route = createRoute({
  ...
  path: '/parent/anything/child'
})
```

:white_check_mark: `parent/anything/child`  
:x: `parent/123/child`  
:x: `parent//child`  
:x: `parent/child`  

```ts
const route = createRoute({
  ...
  path: '/parent/[myParam]/child'
})
```

:white_check_mark: `parent/anything/child`  
:white_check_mark: `parent/123/child`  
:x: `parent//child`  
:x: `parent/child`  

```ts
const route = createRoute({
  ...
  path: '/parent/[?myParam]/child'
})
```

:white_check_mark: `parent/anything/child`  
:white_check_mark: `parent/123/child`  
:white_check_mark: `parent//child`  
:x: `parent/child`  

## Query Matches

Routes `query` must match the structure of the URL search.

```ts
const route = createRoute({
  ...
  query: {
    foo: 'bar',
  },
})
```

:white_check_mark: `?foo=bar`  
:white_check_mark: `?kitbag=cat&foo=bar`  
:x: `?foo=123`  
:x: `?foo`  

```ts
const route = createRoute({
  ...
  query: {
    foo: String,
  },
})
```

:white_check_mark: `?foo=bar`  
:white_check_mark: `?kitbag=cat&foo=bar`  
:white_check_mark: `?foo=123`  
:x: `?foo`  

```ts
const route = createRoute({
  ...
  query: {
    '?foo': String,
  },
})
```

:white_check_mark: `?foo=bar`  
:white_check_mark: `?kitbag=cat&foo=bar`  
:white_check_mark: `?foo=123`  
:white_check_mark: `?foo`  

::: tip
when your query param is optional, the entire property can be missing and the route will still match. For the example above with query `foo=[?bar]`, the url might be `/my-route` without any query, or it might have an unrelated query `/my-route?other=value`, and still be a match because the entire foo param is optional.
:::

## Params Are Valid

Assuming a route's path and query match the structure of the URL, the last test is to make sure that values provided by the URL pass the Param parsing. By default params are assumed to be strings, so by default if structure matches, parsing will pass as well since the URL is a string. However, if you define your params with `Boolean`, `Number`, `Date`, `JSON`, or a custom `Param` the value will be need to pass the param's `get` function.

```ts
const route = createRoute({
  ...
  path: '/parent/[id]'
  query: {
    '?tab': String,
  },
})
```

:white_check_mark: `parent/123`  
:white_check_mark: `parent/123?tab=true`  
:white_check_mark: `parent/123?tab=github`  
:white_check_mark: `parent/ABC?tab=true`  

```ts
const route = createRoute({
  ...
  path: withParams('/parent/[id]', { id: Number })
  query: {
    '?tab': String,
  },
})
```

:white_check_mark: `parent/123`  
:white_check_mark: `parent/123?tab=true`  
:white_check_mark: `parent/123?tab=github`  
:x: `parent/ABC?tab=true`  

```ts
const route = createRoute({
  ...
  path: withParams('/parent/[id]', { id: Number })
  query: withParams('tab=[?tab]', { tab: Boolean })
})
```

:white_check_mark: `parent/123`  
:white_check_mark: `parent/123?tab=true`  
:x: `parent/123?tab=github`  
:x: `parent/ABC?tab=true`  
