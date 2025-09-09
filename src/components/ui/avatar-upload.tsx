import { Box, Button, Text, Image, Circle } from "@chakra-ui/react"
import { useRef, useState } from "react"
import { FiCamera, FiX } from "react-icons/fi"

interface AvatarUploadProps {
  currentAvatar?: string | null
  onAvatarChange: (file: File | null) => void
  size?: "sm" | "md" | "lg" | "xl"
  disabled?: boolean
}

const AvatarUpload = ({ 
  currentAvatar, 
  onAvatarChange, 
  size = "xl",
  disabled = false 
}: AvatarUploadProps) => {
  const [preview, setPreview] = useState<string | null>(currentAvatar || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB')
        return
      }

      // Create preview URL
      const previewUrl = URL.createObjectURL(file)
      setPreview(previewUrl)
      onAvatarChange(file)
    }
  }

  const handleRemoveAvatar = () => {
    setPreview(null)
    onAvatarChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const getSize = (size: string) => {
    switch (size) {
      case "sm": return "32px"
      case "md": return "48px"
      case "lg": return "64px"
      case "xl": return "80px"
      default: return "80px"
    }
  }

  return (
    <Box position="relative" display="inline-block">
      <Circle
        size={getSize(size)}
        cursor={disabled ? "default" : "pointer"}
        onClick={handleClick}
        bg="gray.200"
        _hover={disabled ? {} : { opacity: 0.8 }}
        transition="opacity 0.2s"
        overflow="hidden"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        {preview ? (
          <Image
            src={preview}
            alt="Avatar preview"
            width="100%"
            height="100%"
            objectFit="cover"
          />
        ) : (
          <FiCamera size="24" />
        )}
      </Circle>
      
      {!disabled && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          
          {preview && (
            <Button
              position="absolute"
              top="-2"
              right="-2"
              size="xs"
              borderRadius="full"
              colorScheme="red"
              onClick={(e) => {
                e.stopPropagation()
                handleRemoveAvatar()
              }}
              p={1}
              minW="auto"
              h="20px"
              w="20px"
            >
              <FiX size="12" />
            </Button>
          )}
        </>
      )}
      
      {!disabled && (
        <Text fontSize="xs" color="gray.500" mt={2} textAlign="center">
          Click to upload
        </Text>
      )}
    </Box>
  )
}

export default AvatarUpload
