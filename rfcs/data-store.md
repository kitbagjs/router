# RFC: One store for props and loaders

## Why

A route's values are computed in two places that can't see each other. What a link prefetches goes into a bucket belonging to that link; what a navigation computes goes into a shared store. When a child route needs something from its parent, whether it works depends on which of those two places the parent's value happens to be in, and when.

That split is behind most of a recent run of bugs:

- a child got `undefined` instead of waiting for its parent
- a child waited for a parent whose value already existed a few lines away
- a getter returning `undefined` was indistinguishable from one that hadn't run, which hung navigation
- a getter returning an `Error` was treated as one that failed, and rendered nothing
- a child waiting when the user navigated away was left suspended forever

Each fix was correct and each was local. But they patch a shape with nowhere to record "this has been asked for and isn't ready yet."

We're also adding loaders soon — data fetched for a route but not bound to a component — and they need the same behaviour: `await parent.data.user`, prefetch on hover, and so on. Rather than teach the props store a second job, this proposes one small store that knows nothing about either.

## The idea

**1. A value is a promise from the moment it is first mentioned.**

Today a value only exists once its getter has run. If a child asks first there is nothing to hand it, so the code has to watch and wait for the value to appear.

Instead, the first time anyone mentions a value — the getter about to compute it, or a child waiting on it — we put a promise in the store and keep its resolve and reject. Whoever computes it later settles that promise.

```
child asks for the parent's user   →   promise created, child awaits it
the parent's getter runs          →   that same promise is resolved
```

The child never needs to know when, or by whom.

Alongside the promise we keep the settled value once it exists, so rendering still reads props synchronously and doesn't wait a tick it didn't used to.

**2. Prefetched and committed values have the same shape.**

A link's prefetching gets its own bucket. The current navigation has one too — same structure, same API. A child waiting on a parent watches both and carries on with whichever arrives first.

```ts
await Promise.any([
  ownBucket.read(parentKey),   // the parent's value, if this link prefetches it
  committed.read(parentKey),   // or the one navigation computes
])
```

## What a bucket is

A set of values that live and die together.

- **One per link**, for whatever that link points at. It appears when the link starts prefetching and goes away when the link is removed or points elsewhere.
- **One for the current navigation.**

When a bucket goes away everything in it is rejected — so anything waiting resumes rather than hanging — and then discarded.

Two things are deliberately *not* buckets:

- **Prefetch strategies.** `eager`, `lazy` and `intent` share one bucket per link. They decide *when* a getter runs, not where its value lands. Today they are separate, which is why a value prefetched on render is invisible to a getter that runs on hover.
- **Route params.** Params stay part of a value's name, as they are today. A link that changes target produces different names rather than reusing a bucket.

## Clicking a link

The link's values move into the navigation's bucket. Move, not copy.

If a getter is still running when the click lands, its unfinished promise moves too, so the navigation waits on the getter already in progress instead of starting a second one. Whatever is left in the link's bucket is discarded as usual.

## What this fixes by itself

These stop being bugs and become situations that cannot arise.

**Parent prefetched on render, child on hover.** Same bucket, so the child finds the parent's value already there.

**Child prefetched on render, parent on visibility or hover.** The child runs first and asks for a value the parent has not computed yet. Its request creates the promise, the parent's getter settles it whenever its own turn comes, and the child resumes. No watching, no polling.

**Parent not prefetched at all.** The promise in the child's own bucket is never settled; the navigation's is. Whichever arrives wins.

**A getter that returns `undefined`.** It resolves with `undefined`, which is a perfectly good answer. Nothing mistakes it for "not ready."

## What we are not doing

**Deduplicating.** Two links to the same route with the same params compute twice. Caching an expensive call is a caching problem, and users are better served by a query cache they already control than one we invent.

**Reference counting.** Buckets have owners and lifetimes. Individual values don't need their own bookkeeping.

## Risks

**One real.** If someone clicks a link and immediately navigates elsewhere, the values just handed to the navigation are discarded and that navigation fails. It should — but the router has to read that as "you changed your mind," not as an error worth reporting.

**One to watch.** Every value is a promise, so any of them can reject. A value nobody happens to be waiting on must not become an unhandled rejection. That is handled once, where promises are created, rather than at every place they are read.

## Sequencing

The current stack of fixes should land first — not for the fixes, several of which this makes unnecessary, but for their tests. Between them they cover prefetching across strategies, getters that return nothing, getters that return errors, names with no getter, navigating away mid-wait, and getters that never await. They describe behaviour rather than implementation, so they carry over almost unchanged, and they are what makes replacing this area safe rather than hopeful.
