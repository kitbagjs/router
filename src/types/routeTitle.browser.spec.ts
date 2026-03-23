import { expect, test, vi } from "vite-plus/test";
import { createRoute } from "@/services/createRoute";
import { component } from "@/utilities/testHelpers";
import { createRouter } from "@/services/createRouter";
import { flushPromises } from "@vue/test-utils";

test("route with title updates document title", async () => {
  const route = createRoute({
    name: "root",
    path: "/",
    component,
  });

  const title = "foo";
  const callback = vi.fn(() => title);

  route.setTitle(callback);

  const router = createRouter([route], {
    initialUrl: "/",
  });

  await router.start();

  await flushPromises();

  expect(callback).toHaveBeenCalledTimes(1);
  expect(document.title).toBe(title);
});

test("route with title and parent with title does not call parent getTitle", async () => {
  const parent = createRoute({
    name: "parent",
    path: "/parent",
    component,
  });
  const parentGetTitle = vi.fn(() => "parent");
  parent.setTitle(parentGetTitle);

  const child = createRoute({
    name: "child",
    path: "/child",
    component,
    parent,
  });

  const childGetTitle = vi.fn(() => "child");
  child.setTitle(childGetTitle);

  const router = createRouter([parent, child], {
    initialUrl: "/parent/child",
  });

  await router.start();

  await flushPromises();

  expect(parentGetTitle).not.toHaveBeenCalled();
  expect(childGetTitle).toHaveBeenCalledTimes(1);
  expect(document.title).toBe("child");
});

test("route with title and parent with title does call parent getTitle when called directly", async () => {
  const parent = createRoute({
    name: "parent",
    path: "/parent",
    component,
  });

  const parentGetTitle = vi.fn(() => "parent");
  parent.setTitle(parentGetTitle);

  const child = createRoute({
    name: "child",
    path: "/child",
    component,
    parent,
  });

  const childGetTitle = vi.fn(async (_to, { getParentTitle }) => {
    const parentTitle = await getParentTitle();
    return `${parentTitle} - child`;
  });

  child.setTitle(childGetTitle);

  const router = createRouter([parent, child], {
    initialUrl: "/parent/child",
  });

  await router.start();

  await flushPromises();

  expect(parentGetTitle).toHaveBeenCalledTimes(1);
  expect(childGetTitle).toHaveBeenCalledTimes(1);
  expect(document.title).toBe("parent - child");
});

test("route with title and parent with title does call parent getTitle when called directly", async () => {
  const parent = createRoute({
    name: "parent",
    path: "/parent",
    component,
  });

  const parentGetTitle = vi.fn(() => "parent");
  parent.setTitle(parentGetTitle);

  const child = createRoute({
    name: "child",
    path: "/child",
    component,
    parent,
  });

  const grandchild = createRoute({
    name: "grandchild",
    path: "/grandchild",
    component,
    parent: child,
  });

  const grandchildGetTitle = vi.fn(async (_to, { getParentTitle }) => {
    const parentTitle = await getParentTitle();
    return `${parentTitle} - grandchild`;
  });

  grandchild.setTitle(grandchildGetTitle);

  const router = createRouter([parent, child, grandchild], {
    initialUrl: "/parent/child/grandchild",
  });

  await router.start();

  await flushPromises();

  expect(parentGetTitle).toHaveBeenCalledTimes(1);
  expect(grandchildGetTitle).toHaveBeenCalledTimes(1);
  expect(document.title).toBe("parent - grandchild");
});

test("route without title and parent with title updates document title", async () => {
  const parent = createRoute({
    name: "parent",
    path: "/parent",
    component,
  });

  parent.setTitle(() => "parent");

  const child = createRoute({
    name: "child",
    path: "/child",
    component,
    parent,
  });

  const router = createRouter([parent, child], {
    initialUrl: "/parent/child",
  });

  await router.start();

  await flushPromises();

  expect(document.title).toBe("parent");
});
