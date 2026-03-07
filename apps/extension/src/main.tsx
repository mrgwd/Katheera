/**
 * Extension popup URLs look like:
 *   chrome-extension://[id]/index.html
 *
 * With browser history, TanStack Router reads pathname = "/index.html"
 * and finds no matching route → "Not Found".
 *
 * With hash history, routing is driven by the hash fragment:
 *   chrome-extension://[id]/index.html#/   ← matches "/"
 *   chrome-extension://[id]/index.html#/settings ← matches "/settings"
 *
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  createHashHistory,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import "./index.css";

const hashHistory = createHashHistory();

const router = createRouter({
  routeTree,
  history: hashHistory,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
