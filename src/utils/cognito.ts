/** Cognito Hosted UI helpers (authorization code + PKCE → app JWT via API). */

import { checkAuthSession } from "@/utils/authSession"

const VERIFIER_KEY = "cognito_code_verifier"
const ERROR_KEY = "cognito_login_error"

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ""
  bytes.forEach((b) => {
    binary += String.fromCharCode(b)
  })
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function randomVerifier(length = 64): string {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~"
  const values = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(values, (v) => charset[v % charset.length]).join("")
}

async function sha256(plain: string): Promise<ArrayBuffer> {
  const data = new TextEncoder().encode(plain)
  return crypto.subtle.digest("SHA-256", data)
}

export function isCognitoConfigured(): boolean {
  return Boolean(
    import.meta.env.VITE_COGNITO_CLIENT_ID &&
      import.meta.env.VITE_COGNITO_DOMAIN,
  )
}

export function getCognitoHostedUiBase(): string {
  const domain = (import.meta.env.VITE_COGNITO_DOMAIN || "").replace(/\/$/, "")
  if (domain.startsWith("http://") || domain.startsWith("https://")) {
    return domain
  }
  const region = import.meta.env.VITE_AWS_REGION || "eu-west-1"
  return `https://${domain}.auth.${region}.amazoncognito.com`
}

export function getCognitoRedirectUri(): string {
  // Must match Cognito app client callback URL exactly (no trailing slash).
  return window.location.origin
}

export async function startCognitoLogin(
  identityProvider?: string,
): Promise<void> {
  const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID
  if (!clientId || !import.meta.env.VITE_COGNITO_DOMAIN) {
    throw new Error("Cognito is not configured")
  }
  const verifier = randomVerifier()
  sessionStorage.setItem(VERIFIER_KEY, verifier)
  const challenge = base64UrlEncode(await sha256(verifier))
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    scope: "openid email profile",
    redirect_uri: getCognitoRedirectUri(),
    code_challenge_method: "S256",
    code_challenge: challenge,
  })
  // Omit identity_provider to show Cognito Hosted UI (email/password + social).
  if (identityProvider) {
    params.set("identity_provider", identityProvider)
  }
  window.location.href = `${getCognitoHostedUiBase()}/oauth2/authorize?${params}`
}

export function takeCognitoCodeFromUrl(search?: string): {
  code: string | null
  error: string | null
} {
  const params = new URLSearchParams(
    search ?? (typeof window !== "undefined" ? window.location.search : ""),
  )
  return {
    code: params.get("code"),
    error: params.get("error_description") || params.get("error"),
  }
}

export function clearCognitoCallbackUrl(): void {
  const url = new URL(window.location.href)
  url.searchParams.delete("code")
  url.searchParams.delete("state")
  url.searchParams.delete("error")
  url.searchParams.delete("error_description")
  window.history.replaceState({}, document.title, url.pathname + url.search + url.hash)
}

export function peekCodeVerifier(): string | null {
  return sessionStorage.getItem(VERIFIER_KEY)
}

export function clearCodeVerifier(): void {
  sessionStorage.removeItem(VERIFIER_KEY)
}

export function consumeCognitoLoginError(): string | null {
  const error = sessionStorage.getItem(ERROR_KEY)
  if (error) sessionStorage.removeItem(ERROR_KEY)
  return error
}

const exchangeInFlight = new Map<string, Promise<void>>()

export async function exchangeCognitoCode(code: string): Promise<void> {
  const existing = exchangeInFlight.get(code)
  if (existing) return existing

  const promise = (async () => {
    const codeVerifier = peekCodeVerifier()
    const base = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "")
    const response = await fetch(`${base}/api/v1/login/cognito`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        redirect_uri: getCognitoRedirectUri(),
        code_verifier: codeVerifier,
      }),
    })
    if (!response.ok) {
      let detail: string | unknown = "Cognito login failed"
      try {
        const data = await response.json()
        detail = data.detail || detail
      } catch {
        // ignore
      }
      throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail))
    }
    clearCodeVerifier()
  })().finally(() => {
    exchangeInFlight.delete(code)
  })

  exchangeInFlight.set(code, promise)
  return promise
}

/**
 * Run during root beforeLoad so /_layout auth redirect cannot drop ?code=.
 * Idempotent: a code is exchanged at most once (avoids invalid_grant on remount).
 */
export async function completeCognitoLoginFromSearch(
  search: string,
): Promise<"ok" | "none" | "error"> {
  const { code, error } = takeCognitoCodeFromUrl(search)
  if (error) {
    sessionStorage.setItem(ERROR_KEY, error)
    clearCognitoCallbackUrl()
    return "error"
  }
  if (!code) return "none"

  const handledKey = `cognito_code_handled_${code}`
  if (sessionStorage.getItem(handledKey)) {
    const inFlight = exchangeInFlight.get(code)
    if (inFlight) {
      await inFlight
    }
    clearCognitoCallbackUrl()
    // Return "none" (not "ok") so __root does not hard-reload in a loop when the
    // router still has a stale ?code= in searchStr after history.replaceState.
    return (await checkAuthSession()) ? "none" : "error"
  }
  // Mark before await to prevent a parallel beforeLoad from exchanging twice.
  sessionStorage.setItem(handledKey, "1")

  try {
    await exchangeCognitoCode(code)
    clearCognitoCallbackUrl()
    return "ok"
  } catch (err) {
    if (await checkAuthSession()) {
      clearCognitoCallbackUrl()
      return "none"
    }
    sessionStorage.removeItem(handledKey)
    sessionStorage.setItem(
      ERROR_KEY,
      err instanceof Error ? err.message : "Cognito login failed",
    )
    clearCognitoCallbackUrl()
    return "error"
  }
}
