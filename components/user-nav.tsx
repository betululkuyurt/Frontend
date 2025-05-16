"use client"
/**
 * User Navigation Component
 *
 * Bu bileşen, üst navigasyon çubuğunda bulunan kullanıcı profili dropdown menüsünü oluşturur.
 * Kullanıcıya özel işlemlere ve sayfalara hızlı erişim sağlar.
 *
 * Özellikler:
 * - Kullanıcı avatarı ve kişiselleştirilmiş görünüm
 * - Kullanıcı bilgilerinin gösterimi (isim ve e-posta)
 * - Profil, API Anahtarları ve Ayarlar sayfalarına kolay erişim
 * - Oturum kapatma işlevi
 * - Dropdown tasarımı ile kompakt ve düzenli arayüz
 * - Vurgu ve odaklanma stilleri ile geliştirilmiş erişilebilirlik
 * - Responsive tasarım için uygun boyutlandırma
 */
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Settings, User, CreditCard } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useState, useEffect } from "react"
import Cookies from "js-cookie"
import { decodeJWT, getAccessToken } from "@/lib/auth"

export function UserNav() {
  const router = useRouter()
  const { signOut } = useAuth()
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    initials: "",
  })

  useEffect(() => {
    // Get user data from cookies or JWT token
    const fetchUserData = () => {
      // Try to get email from cookie
      const userEmail = Cookies.get("user_email")

      // Try to get username from JWT token
      const token = getAccessToken()
      const decodedToken = token ? decodeJWT(token) : null

      let name = "User"
      let email = userEmail || ""

      if (decodedToken) {
        name = decodedToken.username || name
        email = decodedToken.email || userEmail || email
      }

      // Generate initials from name
      const initials = name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .toUpperCase()
        .substring(0, 2)

      setUserData({ name, email, initials })
    }

    fetchUserData()
  }, [])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-12 w-12 rounded-full p-0 hover:bg-transparent">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center border-2 border-purple-500/30 shadow-lg transition-all duration-300 hover:border-purple-500/50">
            <span className="text-xl font-bold text-white">
              {userData.initials.charAt(0)}
            </span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{userData.name}</p>
            <p className="text-xs leading-none text-muted-foreground">{userData.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/profile">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/apps/api-keys">
              <CreditCard className="mr-2 h-4 w-4" />
              <span>API Keys</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut} className="cursor-pointer text-red-500 focus:bg-red-500 focus:text-white">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

