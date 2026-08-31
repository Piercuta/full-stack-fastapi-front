import { OpenAPI } from "@/client"

/** Routes where an unauthenticated API response is expected (no redirect loop). */
export const PUBLIC_AUTH_PATHS = [
  "/login",
  "/signup",
  "/recover-password",
  "/reset-password",
] as const

export function isPublicAuthPath(pathname: string = window.location.pathname): boolean {
  return PUBLIC_AUTH_PATHS.some((path) => pathname.startsWith(path))
}

export function apiBaseUrl(): string {
  return (OpenAPI.BASE || import.meta.env.VITE_API_URL || "").replace(/\/$/, "")
}

/** Session check via HttpOnly cookie (no token readable in JS). */
export async function checkAuthSession(): Promise<boolean> {
  try {
    const response = await fetch(`${apiBaseUrl()}/api/v1/users/me`, {
      credentials: "include",
    })
    return response.ok
  } catch {
    return false
  }
}

export async function logoutSession(): Promise<void> {
  await fetch(`${apiBaseUrl()}/api/v1/logout`, {
    method: "POST",
    credentials: "include",
  })
}
