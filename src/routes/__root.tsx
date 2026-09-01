import { Outlet, createRootRoute, redirect } from "@tanstack/react-router"
import React, { Suspense } from "react"

import NotFound from "@/components/Common/NotFound"
import { completeCognitoLoginFromSearch } from "@/utils/cognito"

const loadDevtools = () =>
  Promise.all([
    import("@tanstack/router-devtools"),
    import("@tanstack/react-query-devtools"),
  ]).then(([routerDevtools, reactQueryDevtools]) => {
    return {
      default: () => (
        <>
          <routerDevtools.TanStackRouterDevtools />
          <reactQueryDevtools.ReactQueryDevtools />
        </>
      ),
    }
  })

const TanStackDevtools =
  process.env.NODE_ENV === "production" ? () => null : React.lazy(loadDevtools)

export const Route = createRootRoute({
  beforeLoad: async () => {
    // Must run before /_layout redirects unauthenticated users to /login
    // (that redirect would drop ?code= and skip the token exchange).
    // Use window.location.search only: location.searchStr can stay stale after
    // clearCognitoCallbackUrl() and re-trigger the OAuth handler in a loop.
    const search =
      typeof window !== "undefined" ? window.location.search : ""
    const result = await completeCognitoLoginFromSearch(search)
    if (result === "error") {
      throw redirect({ to: "/login" })
    }
    // "ok" | "none": HttpOnly cookie is set by POST /login/cognito; continue routing.
  },
  component: () => (
    <>
      <Outlet />
      <Suspense>
        <TanStackDevtools />
      </Suspense>
    </>
  ),
  notFoundComponent: () => <NotFound />,
})
