# Route discovery playground

From the repository root:

```sh
npm install
npm run build
npm run discovery:dev
```

Open the URL printed by Vite. Generated siblings appear beside their route modules; the aggregate is `src/routes.generated.ts`. They are gitignored.

- **Checkout:** `CheckoutPage → AddressForm → CountrySelect → countries` is attached automatically. Hover its link to prefetch.
- **Profile:** explicitly attaches the same definition as `locations`; discovery preserves that registration.
- **Account:** both the layout and preferences child consume `session`. Inspect their generated files to see the parent attachment and the child's inherited reuse.
- **Fallback:** intentionally creates a loader during setup. Expect one build-time diagnostic and the runtime's fallback warning. The page still loads.

Edit a loader, remove a `useLoader` call, or add a route module to see regeneration and a full reload. The activity panel shows requests starting before component consumption.

```sh
npm run discovery:generate
npm run discovery:types
npm run discovery:build
```

`discovery:generate` runs the packaged `router generate` command with this playground's Vite config. It exits after generation without starting a server or building the app.

To try an explicit registry, export a route array from `src/registry.ts`, set `routes: ['src/registry.ts']` and `output: false`, then import `./registry.generated` in `src/router.ts`.

The shared loaders declare their `Loader<T>` result types to break circular inference with the globally registered router. The router includes the generated loader attachments, while the root `createLoader` factory is typed from that registered router.

## Import name conflicts

Checkout and profile reuse the existing `countries` import in `shop.routes.generated.ts`.
Shipping and billing use different definitions both exported as `countries`, so
`delivery.routes.generated.ts` imports them as `countries_1` and `countries_2`.
These aliases do not change their loader registration keys.

The delivery and pickup modules both export `destination`. The aggregate imports
those routes as `destination_1` and `destination_2`, while their runtime route names
remain `shipping` and `pickup`.
