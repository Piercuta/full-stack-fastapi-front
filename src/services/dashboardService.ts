import { OpenAPI } from "@/client"

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

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const base = (OpenAPI.BASE || "").replace(/\/$/, "")
  const token = localStorage.getItem("access_token") || ""

  const response = await fetch(`${base}/api/v1/dashboard/stats`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  if (!response.ok) {
    throw new Error(`Dashboard stats failed (${response.status})`)
  }
  return response.json()
}
