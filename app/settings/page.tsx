"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChevronLeft, SettingsIcon, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import Cookies from "js-cookie"
import { NavBar } from "@/components/nav-bar"

export default function SettingsPage() {
  const router = useRouter()
  const { toast } = useToast()
  
  // Security settings state
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: ""
  })
  const [isSecurityLoading, setIsSecurityLoading] = useState(false)
  const [securityError, setSecurityError] = useState("")
  
  // Handle password fields change
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    const fieldName = id.replace(/-/g, '_')
    setPasswordForm({
      ...passwordForm,
      [fieldName]: value
    })
  }
  
  // Security settings save handler
  const handleSecuritySave = async () => {
    // Password validation
    if (passwordForm.new_password && passwordForm.new_password.length < 2) {
      setSecurityError("Password must be at least 2 characters")
      return
    }
    
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setSecurityError("Passwords do not match")
      return
    }
    
    if (!passwordForm.current_password && passwordForm.new_password) {
      setSecurityError("Current password is required")
      return
    }
    
    setIsSecurityLoading(true)
    setSecurityError("")
    
    try {
      // Only make API call if password fields are filled
      if (passwordForm.current_password && passwordForm.new_password) {
        const userId = Cookies.get("user_id") || "4" // Default to 4 if not in cookie
        
        const response = await fetch(
          `http://127.0.0.1:8000/api/v1/auth/change-password?current_user_id=${userId}`, 
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${Cookies.get("access_token")}`
            },
            body: JSON.stringify(passwordForm)
          }
        )
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.detail || "Failed to save security settings")
        }
        
        // Reset password fields on success
        setPasswordForm({
          current_password: "",
          new_password: "",
          confirm_password: ""
        })
        
        toast({
          title: "Security settings updated",
          description: "Your password has been changed successfully",
          duration: 3000
        })
      } else if (passwordForm.current_password || passwordForm.new_password || passwordForm.confirm_password) {
        // If some but not all password fields are filled
        setSecurityError("Please fill all password fields")
        return
      }
    } catch (error) {
      console.error("Error saving security settings:", error)
      setSecurityError(error instanceof Error ? error.message : "Failed to save security settings")
    } finally {
      setIsSecurityLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/20 to-black">
      <NavBar />

      <main className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center h-16 my-2 relative">
            <Button
              variant="ghost"
              onClick={() => router.push("/apps")}
              className="flex items-center text-gray-300 hover:text-white p-0 hover:bg-transparent absolute left-0"
            >
              <ChevronLeft className="h-5 w-5 mr-2" />
            </Button>
            <div className="flex items-center justify-center w-full">
              <SettingsIcon className="h-5 w-5 text-purple-400 mr-2" />
              <span className="text-white font-semibold">Settings</span>
            </div>
          </div>

          <div className="grid gap-6">
            <div className="p-4 rounded-lg bg-black/30 border border-purple-900/30">
              <div className="flex flex-col gap-1 mb-4">
                <Label className="text-base">Change Password</Label>
                <span className="text-sm text-gray-400">Update your password to keep your account secure</span>
              </div>
              
              {securityError && (
                <div className="bg-red-900/20 border border-red-500/50 text-red-200 text-sm p-3 rounded-md mb-4">
                  {securityError}
                </div>
              )}
              
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input 
                    id="current-password"
                    type="password" 
                    value={passwordForm.current_password}
                    onChange={handlePasswordChange}
                    className="bg-black/30 border-purple-900/30" 
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input 
                    id="new-password" 
                    type="password" 
                    value={passwordForm.new_password}
                    onChange={handlePasswordChange}
                    className="bg-black/30 border-purple-900/30" 
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input 
                    id="confirm-password" 
                    type="password" 
                    value={passwordForm.confirm_password}
                    onChange={handlePasswordChange}
                    className="bg-black/30 border-purple-900/30" 
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button 
                className="bg-purple-600 hover:bg-purple-700"
                onClick={handleSecuritySave}
                disabled={isSecurityLoading}
              >
                {isSecurityLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

