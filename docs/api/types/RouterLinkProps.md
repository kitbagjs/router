# Types: RouterLinkProps\<TRouter\>

```ts
type RouterLinkProps<TRouter> = RouterPushOptions & object;
```

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-trouter"></a> `TRouter` *extends* [`Router`](Router.md) |

## Type Declaration

### prefetch?

```ts
prefetch?: PrefetchConfig;
```

Determines what assets are prefetched when router-link is rendered for this route. Overrides route level prefetch.

### target?

```ts
target?: string;
```

The target attribute for the anchor element.

### to

```ts
to: 
  | UrlString
  | ResolvedRoute
| ToCallback<TRouter>;
```

The url string to navigate to or a callback that returns a url string
