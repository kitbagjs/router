# Introduction

Kitbag Router introduces a fresh, developer-centric approach to routing in Vue.js applications.

At the heart of Kitbag Router lies a commitment to enhancing the developer experience.  First and foremost that means **type safety**, but also **better parameter experience**, **support for query**, **rejection handling**, simple intuitive syntax, and an extensible design written with modern Typescript.

## Why Does Vue Need a New Router?

Vue router has served us well for the **many** years it's been around. However, there are some unfortunate aspects that all of us have just become accustomed to.

| Vue Router | Kitbag Router |
| -- | -- |
| :x: Not type safe | :white_check_mark: Types safety **everywhere** |
| :x: Weak params | :white_check_mark: Params can be **any type**, **reactive**, and **writable** |
| :x: Only params in path | :white_check_mark: Params can be **anywhere** |
| :x: No rejection handling | :white_check_mark: Built in rejection handling that's customizable |
| :x: Not intuitive | :white_check_mark: No magic, url is assembled exactly how you'd expect |
| :x: Old and bloated | :white_check_mark: 128kB, 1 dependency, written with modern Typescript |

## Type Safety

You already know what routes exist, so why are we using magic strings and hoping it works out? With Kitbag Router, the routes that are available to you couldn't be clearer. If the routes change, Typescript will tell you the links that need to be updated.

## Better Route Params

Adding dynamic parameters to your route is just as easy as you'd expect but infinitely more powerful. With Kitbag Router, your parameters can be expressed as `String`, `Number`, `Boolean`, `Date`, `JSON`, `RegExp`, or literally anything else. Parameters in the route will be expected when navigating (type safety!). This param type is enforced when matching routes, so routes can be differentiated by subtle changes in param types.

## Support for Query

Defining a query on routes can control route matching, just like it does with the path. Better yet, with Kitbag Router you get the same support for params inside the query as you do the path!

## Rejection Handling

Virtually every app that needs a router will eventually need to handle URLs without a match (404), routes protected by auth (401) but the solution is on you to figure out. With Kitbag Router you have this functionality out of the box.
