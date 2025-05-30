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
          {/* Enhanced Header */}
          <div className="flex items-center justify-between mb-8">
            <Button
              variant="ghost"
              onClick={() => router.push("/apps")}
              className="flex items-center text-gray-300 hover:text-white hover:bg-purple-900/20 px-3 py-2 rounded-lg transition-all duration-300"
            >
              <ChevronLeft className="h-5 w-5 mr-2" />
              Back to Apps
            </Button>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center">
                <SettingsIcon className="h-4 w-4 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">Settings</h1>
            </div>
          </div>

          <div className="grid gap-8">
            {/* Security Section */}
            <div className="bg-black/60 backdrop-blur-sm border border-purple-900/30 rounded-2xl overflow-hidden">
              <div className="border-b border-purple-900/20 bg-gradient-to-r from-purple-900/10 to-transparent p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
                    <div className="w-3 h-3 border border-white rounded-sm"></div>
                  </div>
                  <div>
                    <h2 className="text-white text-xl font-semibold">Security</h2>
                    <p className="text-gray-400 mt-1">Manage your account security and password settings</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-white mb-2">Change Password</h3>
                  <p className="text-gray-400 text-sm">Update your password to keep your account secure. Use a strong password with at least 8 characters.</p>
                </div>
                
                {securityError && (
                  <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-200 text-sm backdrop-blur-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-red-500 rounded-full flex-shrink-0"></div>
                      <span>{securityError}</span>
                    </div>
                  </div>
                )}
                
                <div className="grid gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="current-password" className="text-gray-300 font-medium">Current Password</Label>
                    <Input 
                      id="current-password"
                      type="password" 
                      placeholder="Enter your current password"
                      value={passwordForm.current_password}
                      onChange={handlePasswordChange}
                      className="bg-black/40 border-purple-900/40 text-gray-200 h-12 rounded-xl focus:border-purple-500/60 focus:ring-purple-500/20" 
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="new-password" className="text-gray-300 font-medium">New Password</Label>
                    <Input 
                      id="new-password" 
                      type="password" 
                      placeholder="Enter your new password"
                      value={passwordForm.new_password}
                      onChange={handlePasswordChange}
                      className="bg-black/40 border-purple-900/40 text-gray-200 h-12 rounded-xl focus:border-purple-500/60 focus:ring-purple-500/20" 
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="confirm-password" className="text-gray-300 font-medium">Confirm New Password</Label>
                    <Input 
                      id="confirm-password" 
                      type="password" 
                      placeholder="Confirm your new password"
                      value={passwordForm.confirm_password}
                      onChange={handlePasswordChange}
                      className="bg-black/40 border-purple-900/40 text-gray-200 h-12 rounded-xl focus:border-purple-500/60 focus:ring-purple-500/20" 
                    />
                  </div>
                </div>
                
                <div className="flex justify-end mt-8">
                  <Button 
                    className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white border-0 rounded-xl px-6 py-3 transition-all duration-300 shadow-lg hover:shadow-purple-500/25"
                    onClick={handleSecuritySave}
                    disabled={isSecurityLoading}
                  >
                    {isSecurityLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving Changes...
                      </>
                    ) : (
                      "Update Password"
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="border-t border-purple-900/20 bg-gradient-to-r from-purple-900/5 to-transparent p-6">
                <div className="flex items-center space-x-3 text-sm text-gray-400">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  <p>Your password is encrypted and stored securely. We never share your credentials with third parties.</p>
                </div>
              </div>
            </div>

            {/* Account Section */}
            <div className="bg-black/60 backdrop-blur-sm border border-purple-900/30 rounded-2xl overflow-hidden">
              <div className="border-b border-purple-900/20 bg-gradient-to-r from-blue-900/10 to-transparent p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                  </div>
                  <div>
                    <h2 className="text-white text-xl font-semibold">Account</h2>
                    <p className="text-gray-400 mt-1">Manage your account preferences and profile settings</p>
                  </div>
                </div>
              </div>
              
              <div className="p-12">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-900/30 to-blue-800/20 flex items-center justify-center mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                      <SettingsIcon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">More Settings Coming Soon</h3>
                  <p className="text-gray-400 mb-6 max-w-md">
                    Additional account settings and preferences will be available in future updates. 
                    Stay tuned for profile customization, notification preferences, and more.
                  </p>
                </div>
              </div>
            </div>

            {/* Preferences Section */}
            <div className="bg-black/60 backdrop-blur-sm border border-purple-900/30 rounded-2xl overflow-hidden">
              <div className="border-b border-purple-900/20 bg-gradient-to-r from-amber-900/10 to-transparent p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center">
                    <div className="w-3 h-3 border border-white rounded-sm"></div>
                  </div>
                  <div>
                    <h2 className="text-white text-xl font-semibold">Preferences</h2>
                    <p className="text-gray-400 mt-1">Customize your experience and application behavior</p>
                  </div>
                </div>
              </div>
              
              <div className="p-12">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-900/30 to-amber-800/20 flex items-center justify-center mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-600 to-amber-800 rounded-lg flex items-center justify-center">
                      <div className="w-5 h-5 border border-white rounded-sm"></div>
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Customization Options</h3>
                  <p className="text-gray-400 mb-6 max-w-md">
                    Theme preferences, language settings, and other customization options will be added soon 
                    to help you personalize your experience.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

