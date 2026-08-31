import { apiBaseUrl } from "@/utils/authSession"

export type DashboardSeriesPoint = {
  date: string
  items: number
}

export type DashboardStats = {
  users: number
  items: number
  avatars: number
  jobs_pending: number
  jobs_failed: number
  api_healthy: boolean
  series: DashboardSeriesPoint[]
}

export type DashboardCacheInfo = {
  enabled: boolean
  redis_reachable: boolean
  key: string
  ttl_seconds: number | null
  configured_ttl_seconds: number
  payload: DashboardStats | null
}

const fetchInit: RequestInit = { credentials: "include" }

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const response = await fetch(`${apiBaseUrl()}/api/v1/dashboard/stats`, fetchInit)
  if (!response.ok) {
    throw new Error(`Dashboard stats failed (${response.status})`)
  }
  return response.json()
}

export async function fetchDashboardCache(): Promise<DashboardCacheInfo> {
  const response = await fetch(`${apiBaseUrl()}/api/v1/dashboard/cache`, fetchInit)
  if (!response.ok) {
    throw new Error(`Dashboard cache failed (${response.status})`)
  }
  return response.json()
}

export async function invalidateDashboardCache(): Promise<{ message: string }> {
  const response = await fetch(`${apiBaseUrl()}/api/v1/dashboard/cache`, {
    ...fetchInit,
    method: "DELETE",
  })
  if (!response.ok) {
    throw new Error(`Invalidate cache failed (${response.status})`)
  }
  return response.json()
}
