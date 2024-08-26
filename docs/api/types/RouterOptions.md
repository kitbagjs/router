# RouterOptions

```ts
type RouterOptions: object & RouterRejectionComponents;
```

Options to initialize a [Router](Router) instance.

## Type declaration

### historyMode?

```ts
optional historyMode: RouterHistoryMode;
```

Specifies the history mode for the router, such as 'hash', 'history', or 'abstract'.

### initialUrl?

```ts
optional initialUrl: string;
```

Initial URL for the router to use. Required if using Node environment.  If host is included, the router will use validate that changes to route are within the same host.

#### Default

```ts
window.location.toString()
```

### Base?

```ts
optional base: string;
```

Base path to be prepended to any URL. Can be used for Vue applications that run in nested folder for domain. For example having `base` of `/foo` would assume all routes should start with `your.domain.com/foo`.
