import { OpenAPI } from "@/client"

export type MediaJobStatus = "queued" | "processing" | "done" | "failed"

export type MediaJob = {
  id: string
  status: MediaJobStatus
  original_s3_key: string
  original_url: string
  content_type?: string | null
  result_urls: string[]
  error?: string | null
  created_at: string
  updated_at: string
}

export type MediaJobsResponse = {
  data: MediaJob[]
  count: number
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("access_token") || ""
  return { Authorization: `Bearer ${token}` }
}

function apiBase(): string {
  return (OpenAPI.BASE || "").replace(/\/$/, "")
}

export async function listMediaJobs(): Promise<MediaJobsResponse> {
  const response = await fetch(`${apiBase()}/api/v1/media/jobs`, {
    headers: authHeaders(),
  })
  if (!response.ok) {
    throw new Error(`List media jobs failed (${response.status})`)
  }
  return response.json()
}

export async function uploadMedia(file: File): Promise<MediaJob> {
  const body = new FormData()
  body.append("file", file)
  const response = await fetch(`${apiBase()}/api/v1/media/upload`, {
    method: "POST",
    headers: authHeaders(),
    body,
  })
  if (!response.ok) {
    let detail = `Upload failed (${response.status})`
    try {
      const data = await response.json()
      detail = data.detail || detail
    } catch {
      // ignore
    }
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail))
  }
  return response.json()
}
