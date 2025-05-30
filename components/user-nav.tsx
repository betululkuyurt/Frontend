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
      }      // Generate initials from name
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
        <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 hover:bg-transparent group">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center border border-purple-500/30 shadow-lg transition-all duration-300 hover:border-purple-500/60 hover:shadow-purple-500/25 group-hover:scale-105">
            <span className="text-sm font-bold text-white transition-transform duration-300 group-hover:scale-110">
              {userData.initials.charAt(0)}
            </span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 bg-black/90 backdrop-blur-sm border border-purple-900/50 rounded-xl p-1 shadow-2xl shadow-purple-900/20" align="end">
        <DropdownMenuLabel className="p-3">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center border border-purple-500/30 shadow-lg flex-shrink-0">
              <span className="text-sm font-bold text-white">
                {userData.initials}
              </span>
            </div>
            <div className="flex flex-col space-y-1 min-w-0 flex-1">
              <p className="text-sm font-semibold text-white leading-none truncate">{userData.name}</p>
              <p className="text-xs text-gray-400 leading-none truncate">{userData.email}</p>
              <div className="flex items-center space-x-1 mt-1">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-emerald-400 font-medium">Online</span>
              </div>
            </div>
          </div>
        </DropdownMenuLabel>        <DropdownMenuSeparator className="bg-purple-900/30 my-1" />
        <DropdownMenuGroup className="space-y-0.5">
          <DropdownMenuItem asChild className="rounded-lg mx-1">
            <Link href="/profile" className="flex items-center px-2 py-2 text-gray-300 hover:text-white hover:bg-purple-900/20 transition-all duration-200 group">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-600/20 to-blue-800/20 flex items-center justify-center mr-2 group-hover:from-blue-600/30 group-hover:to-blue-800/30 transition-all duration-200">
                <User className="h-3 w-3 text-blue-400" />
              </div>
              <span className="text-sm font-medium">Profile</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="rounded-lg mx-1">
            <Link href="/apps/api-keys" className="flex items-center px-2 py-2 text-gray-300 hover:text-white hover:bg-purple-900/20 transition-all duration-200 group">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-green-600/20 to-green-800/20 flex items-center justify-center mr-2 group-hover:from-green-600/30 group-hover:to-green-800/30 transition-all duration-200">
                <CreditCard className="h-3 w-3 text-green-400" />
              </div>
              <span className="text-sm font-medium">API Keys</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="rounded-lg mx-1">
            <Link href="/settings" className="flex items-center px-2 py-2 text-gray-300 hover:text-white hover:bg-purple-900/20 transition-all duration-200 group">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-amber-600/20 to-amber-800/20 flex items-center justify-center mr-2 group-hover:from-amber-600/30 group-hover:to-amber-800/30 transition-all duration-200">
                <Settings className="h-3 w-3 text-amber-400" />
              </div>
              <span className="text-sm font-medium">Settings</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-purple-900/30 my-1" />
        <DropdownMenuItem 
          onClick={signOut} 
          className="cursor-pointer text-red-400 hover:text-white hover:bg-red-600/20 rounded-lg mx-1 px-2 py-2 transition-all duration-200 group"
        >
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-red-600/20 to-red-800/20 flex items-center justify-center mr-2 group-hover:from-red-600/30 group-hover:to-red-800/30 transition-all duration-200">
            <LogOut className="h-3 w-3 text-red-400" />
          </div>
          <span className="text-sm font-medium">Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

