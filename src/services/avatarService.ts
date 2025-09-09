// Service pour gérer les avatars
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

class AvatarService {
  private async getAuthHeaders() {
    const token = localStorage.getItem('access_token')
    return {
      'Authorization': `Bearer ${token}`,
    }
  }

  private async getUploadHeaders() {
    const token = localStorage.getItem('access_token')
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
    }
  }

  /**
   * Uploader un avatar
   */
  async uploadAvatar(file: File): Promise<string> {
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/users/me/avatar`,
        formData,
        {
          headers: await this.getUploadHeaders()
        }
      )

      return response.data.avatar_url
    } catch (error) {
      console.error('Erreur lors de l\'upload de l\'avatar:', error)
      throw new Error('Échec de l\'upload de l\'avatar')
    }
  }

  /**
   * Récupérer l'avatar de l'utilisateur connecté
   */
  async getAvatar(): Promise<string | null> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/v1/users/me/avatar`,
        {
          headers: await this.getAuthHeaders()
        }
      )

      return response.data.avatar_url || null
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'avatar:', error)
      return null
    }
  }

  /**
   * Supprimer l'avatar de l'utilisateur connecté
   */
  async deleteAvatar(): Promise<void> {
    try {
      await axios.delete(
        `${API_BASE_URL}/api/v1/users/me/avatar`,
        {
          headers: await this.getAuthHeaders()
        }
      )
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'avatar:', error)
      throw new Error('Échec de la suppression de l\'avatar')
    }
  }

  /**
   * Construire l'URL complète de l'avatar
   */
  getAvatarUrl(avatarUrl: string | null | undefined): string | null {
    if (!avatarUrl) return null
    
    // Si c'est déjà une URL complète, la retourner
    if (avatarUrl.startsWith('http')) {
      return avatarUrl
    }
    
    // Sinon, construire l'URL complète
    return `${API_BASE_URL}/media/${avatarUrl}`
  }
}

export default new AvatarService()
