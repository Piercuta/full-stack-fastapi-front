import { type UserPublic } from "@/client"

// Extended user type with avatar support
export interface UserWithAvatar extends UserPublic {
  avatar_url?: string | null
}

// Extended user update type with avatar support
export interface UserUpdateMeWithAvatar {
  full_name?: string | null
  email?: string | null
  avatar_url?: string | null
}
