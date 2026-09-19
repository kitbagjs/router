# Types: RouterOptions

```ts
type RouterOptions = TransformerOptions & object;
```

Options to initialize a [Router](Router.md) instance.

## Type Declaration

### base?

```ts
optional base?: string;
```

Base path to be prepended to any URL. Can be used for Vue applications that run in nested folder for domain.
For example having `base` of `/foo` would assume all routes should start with `your.domain.com/foo`.

### historyMode?

```ts
optional historyMode?: RouterHistoryMode;
```

Specifies the history mode for the router, such as "browser", "memory", or "hash".

#### Default

```ts
"auto"
```

### initialUrl?

```ts
optional initialUrl?: string;
```

Initial URL for the router to use. Required if using Node environment. Defaults to window.location when using browser.

#### Default

```ts
window.location.toString()
```

### isGlobalRouter?

```ts
optional isGlobalRouter?: boolean;
```

When false, createRouterAssets must be used for component and hooks. Assets exported by the library
will not work with the created router instance.

#### Default

```ts
true
```

### prefetch?

```ts
optional prefetch?: PrefetchConfig;
```

Determines what assets are prefetched when router-link is rendered for a specific route

### redirectStatus?

```ts
optional redirectStatus?: RedirectStatus;
```

The status `render` responds with for a normalized url or a route redirect that does not declare
its own.

#### Default

```ts
302
```

### rejections?

```ts
optional rejections?: Rejections;
```

Components assigned to each type of rejection your router supports.

### rejectStatus?

```ts
optional rejectStatus?: number;
```

The status `render` responds with for a rejection that does not declare its own.

#### Default

```ts
200
```

### removeTrailingSlashes?

```ts
optional removeTrailingSlashes?: boolean;
```

Removes trailing slashes from the URL before matching routes. The browser's url is updated to reflect using `router.replace`.

#### Default

```ts
true
```

### ssr?

```ts
optional ssr?: boolean;
```

Marks the router as rendering on a server, so every navigation is part of the server render from
the moment the router is created. Required to call `render`.
