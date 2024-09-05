# RouterLink

RouterLink component renders anchor tag (`<a>`) for routing both within the SPA and to external locations.

## Props

| Parameter | Type |
| :---- | :---- |
| to | [`Url`](/api/types/Url) \| `(resolve: RouterResolve) => Url` |
| query | `Record<string, string>` \| `undefined` |
| replace | `boolean` \| `undefined` |
| prefetch | `boolean` \| `PrefetchConfigOptions` \| `undefined` |

[RouterResolve](/api/types/RouterResolve)

## Slots

### Default

| Scope Property | Type |
| :---- | :---- |
| resolved | string |
| isMatch | boolean |
| isExactMatch | boolean |
| isExternal | boolean |

## Notes

RouterLink applies class names for styling

- `router-link--match` -> route is current route or ancestor of current route
- `router-link--exact-match` -> route is current route
