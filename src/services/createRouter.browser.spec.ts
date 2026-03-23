import { flushPromises, mount } from "@vue/test-utils";
import { describe, expect, test } from "vite-plus/test";
import { createRoute } from "@/services/createRoute";
import { createRouter } from "@/services/createRouter";
import { component } from "@/utilities/testHelpers";
import { createRejection } from "./createRejection";

test("Router is automatically started when installed", async () => {
  const route = createRoute({
    name: "root",
    path: "/",
    component,
  });

  const router = createRouter([route], {
    initialUrl: "/",
  });

  const root = {
    template: "<RouterView/>",
  };

  expect(router.route.name).toBe("NotFound");

  mount(root, {
    global: {
      plugins: [router],
    },
  });

  await router.start();

  expect(router.route.name).toBe("root");
});

describe("options.rejections", () => {
  test("given a rejection, adds the rejection to the router", async () => {
    const route = createRoute({
      name: "root",
      path: "/",
      component,
    });

    const customRejection = createRejection({
      type: "CustomRejection",
      component: { template: "<div>This is a custom rejection</div>" },
    });

    const router = createRouter([route], {
      initialUrl: "/",
      rejections: [customRejection],
    });

    const root = {
      template: "<RouterView/>",
    };

    const wrapper = mount(root, {
      global: {
        plugins: [router],
      },
    });

    await router.start();

    expect(router.route.name).toBe("root");

    router.reject("CustomRejection");

    await flushPromises();

    expect(router.route.name).toBe("root");
    expect(window.location.pathname).toBe("/");

    expect(wrapper.html()).toBe("<div>This is a custom rejection</div>");
  });
});

test("given child has hoist, keeps parent context and components without parent url", async () => {
  const parent = createRoute({
    name: "parent",
    path: "/parent",
    component: { template: '<div class="parent"><RouterView/></div>' },
  });

  const child = createRoute({
    name: "child",
    parent,
    hoist: true,
    path: "/child/[?child]",
    component: { template: '<i class="child" />' },
  });

  const router = createRouter([child], { initialUrl: "/" });

  const root = {
    template: "<RouterView/>",
  };

  const wrapper = mount(root, {
    global: {
      plugins: [router],
    },
  });

  await router.start();

  await router.push("child", { child: "42" });

  expect(router.route).toMatchObject(
    expect.objectContaining({
      name: "child",
      href: "/child/42",
    }),
  );

  expect(wrapper.html()).toBe('<div class="parent"><i class="child"></i></div>');
});
