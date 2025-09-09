import { Box, Button, Flex, Text, Image, Circle } from "@chakra-ui/react"
import { Link } from "@tanstack/react-router"
import { FaUserAstronaut } from "react-icons/fa"
import { FiLogOut, FiUser } from "react-icons/fi"

import useAuth from "@/hooks/useAuth"
import { type UserWithAvatar } from "@/types/user"
import { MenuContent, MenuItem, MenuRoot, MenuTrigger } from "../ui/menu"

const UserMenu = () => {
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    logout()
  }

  return (
    <>
      {/* Desktop */}
      <Flex>
        <MenuRoot>
          <MenuTrigger asChild p={2}>
            <Button data-testid="user-menu" variant="solid" maxW="sm" truncate>
              <Circle
                size="32px"
                bg="gray.200"
                overflow="hidden"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                {(user as UserWithAvatar)?.avatar_url ? (
                  <Image
                    src={(user as UserWithAvatar)?.avatar_url || undefined}
                    alt="User avatar"
                    width="100%"
                    height="100%"
                    objectFit="cover"
                  />
                ) : (
                  <FaUserAstronaut fontSize="12" />
                )}
              </Circle>
              <Text ml={2}>{user?.full_name || "User"}</Text>
            </Button>
          </MenuTrigger>

          <MenuContent>
            <Link to="settings">
              <MenuItem
                closeOnSelect
                value="user-settings"
                gap={2}
                py={2}
                style={{ cursor: "pointer" }}
              >
                <FiUser fontSize="18px" />
                <Box flex="1">My Profile</Box>
              </MenuItem>
            </Link>

            <MenuItem
              value="logout"
              gap={2}
              py={2}
              onClick={handleLogout}
              style={{ cursor: "pointer" }}
            >
              <FiLogOut />
              Log Out
            </MenuItem>
          </MenuContent>
        </MenuRoot>
      </Flex>
    </>
  )
}

export default UserMenu
