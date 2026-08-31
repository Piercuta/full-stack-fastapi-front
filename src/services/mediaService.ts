import { apiBaseUrl } from "@/utils/authSession"

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

const fetchInit: RequestInit = { credentials: "include" }

export async function listMediaJobs(): Promise<MediaJobsResponse> {
  const response = await fetch(`${apiBaseUrl()}/api/v1/media/jobs`, fetchInit)
  if (!response.ok) {
    throw new Error(`List media jobs failed (${response.status})`)
  }
  return response.json()
}

export async function uploadMedia(file: File): Promise<MediaJob> {
  const body = new FormData()
  body.append("file", file)
  const response = await fetch(`${apiBaseUrl()}/api/v1/media/upload`, {
    ...fetchInit,
    method: "POST",
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
