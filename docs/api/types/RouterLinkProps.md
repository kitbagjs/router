# Types: RouterLinkProps\<TRouter\>

```ts
type RouterLinkProps<TRouter> = RouterPushOptions & object;
```

## Type Declaration

### prefetch?

```ts
optional prefetch: PrefetchConfig;
```

Determines what assets are prefetched when router-link is rendered for this route. Overrides route level prefetch.

### to

```ts
to: 
  | Url
  | ResolvedRoute
| ToCallback<TRouter>;
```

The url string to navigate to or a callback that returns a url string

## Type Parameters

| Type Parameter |
| ------ |
| `TRouter` *extends* [`Router`](Router.md) |
