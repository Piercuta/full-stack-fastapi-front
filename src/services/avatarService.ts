// Service for avatar upload and retrieval (auth via HttpOnly cookie).
import axios from "axios"

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

const axiosConfig = {
  withCredentials: true,
}

class AvatarService {
  /**
   * Upload an avatar for the current user.
   */
  async uploadAvatar(file: File): Promise<string> {
    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/users/me/avatar`,
        formData,
        {
          ...axiosConfig,
          headers: { "Content-Type": "multipart/form-data" },
        },
      )

      return response.data.avatar_url
    } catch (error) {
      console.error("Avatar upload failed:", error)
      throw new Error("Avatar upload failed")
    }
  }

  /**
   * Get the current user's avatar URL.
   */
  async getAvatar(): Promise<string | null> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/v1/users/me/avatar`,
        axiosConfig,
      )

      return response.data.avatar_url || null
    } catch (error) {
      console.error("Avatar fetch failed:", error)
      return null
    }
  }

  /**
   * Delete the current user's avatar.
   */
  async deleteAvatar(): Promise<void> {
    try {
      await axios.delete(`${API_BASE_URL}/api/v1/users/me/avatar`, axiosConfig)
    } catch (error) {
      console.error("Avatar delete failed:", error)
      throw new Error("Avatar delete failed")
    }
  }

  /**
   * Build a full avatar URL from a stored path or absolute URL.
   */
  getAvatarUrl(avatarUrl: string | null | undefined): string | null {
    if (!avatarUrl) return null

    if (avatarUrl.startsWith("http")) {
      return avatarUrl
    }

    return `${API_BASE_URL}/media/${avatarUrl}`
  }
}

export default new AvatarService()
