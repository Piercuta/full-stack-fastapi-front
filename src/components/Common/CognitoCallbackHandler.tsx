import { useEffect, useState } from "react"
import { useNavigate } from "@tanstack/react-router"

import {
  clearCognitoCallbackUrl,
  exchangeCognitoCode,
  takeCognitoCodeFromUrl,
} from "@/utils/cognito"

/**
 * Handles Cognito redirect (?code=...) on any page (callback is site origin).
 */
export default function CognitoCallbackHandler() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const { code, error: oauthError } = takeCognitoCodeFromUrl()
    if (oauthError) {
      setError(oauthError)
      clearCognitoCallbackUrl()
      return
    }
    if (!code || busy) return

    let cancelled = false
    setBusy(true)
    ;(async () => {
      try {
        const accessToken = await exchangeCognitoCode(code)
        if (cancelled) return
        localStorage.setItem("access_token", accessToken)
        clearCognitoCallbackUrl()
        navigate({ to: "/" })
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : "Cognito login failed")
        clearCognitoCallbackUrl()
      } finally {
        if (!cancelled) setBusy(false)
      }
    })()

    return () => {
      cancelled = true
    }
    // Run once on mount for the current URL search params.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!busy && !error) return null

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(255,255,255,0.85)",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {busy ? <p>Signing you in…</p> : null}
      {error ? (
        <p style={{ color: "#b91c1c", maxWidth: 420, textAlign: "center" }}>
          {error}
        </p>
      ) : null}
    </div>
  )
}
