# Types: RouterOptions

```ts
type RouterOptions = object;
```

Options to initialize a [Router](Router.md) instance.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="base"></a> `base?` | `string` | Base path to be prepended to any URL. Can be used for Vue applications that run in nested folder for domain. For example having `base` of `/foo` would assume all routes should start with `your.domain.com/foo`. |
| <a id="historymode"></a> `historyMode?` | `RouterHistoryMode` | Specifies the history mode for the router, such as "browser", "memory", or "hash". **Default** `"auto"` |
| <a id="initialurl"></a> `initialUrl?` | `string` | Initial URL for the router to use. Required if using Node environment. Defaults to window.location when using browser. **Default** `window.location.toString()` |
| <a id="isglobalrouter"></a> `isGlobalRouter?` | `boolean` | When false, createRouterAssets must be used for component and hooks. Assets exported by the library will not work with the created router instance. **Default** `true` |
| <a id="prefetch"></a> `prefetch?` | [`PrefetchConfig`](PrefetchConfig.md) | Determines what assets are prefetched when router-link is rendered for a specific route |
| <a id="rejections"></a> `rejections?` | `Rejections` | Components assigned to each type of rejection your router supports. |
| <a id="removetrailingslashes"></a> `removeTrailingSlashes?` | `boolean` | Removes trailing slashes from the URL before matching routes. The browser's url is updated to reflect using `router.replace`. **Default** `true` |
