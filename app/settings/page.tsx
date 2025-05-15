"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, User, Moon, Sun, SettingsIcon, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"
import Cookies from "js-cookie"

export default function SettingsPage() {
  const [isDark, setIsDark] = useState(true)
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
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  
  // Account settings state
  const [accountForm, setAccountForm] = useState({
    name: "DBU Team",
    email: "dbu@example.com",
    bio: ""
  })
  const [isAccountLoading, setIsAccountLoading] = useState(false)
  
  // Appearance settings state
  const [colorScheme, setColorScheme] = useState("purple")
  const [isAppearanceLoading, setIsAppearanceLoading] = useState(false)
  
  // Notifications settings state
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    marketingEmails: false
  })
  const [isNotificationsLoading, setIsNotificationsLoading] = useState(false)
  
  // Handle password fields change
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    const fieldName = id.replace(/-/g, '_') // Convert kebab-case to snake_case
    setPasswordForm({
      ...passwordForm,
      [fieldName]: value
    })
  }
  
  // Handle account form changes
  const handleAccountChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setAccountForm({
      ...accountForm,
      [id]: value
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
      } else {
        // If no password fields are filled, just save 2FA setting
        toast({
          title: "Security settings updated",
          description: `Two-factor authentication ${twoFactorEnabled ? 'enabled' : 'disabled'}`,
          duration: 3000
        })
      }
    } catch (error) {
      console.error("Error saving security settings:", error)
      setSecurityError(error instanceof Error ? error.message : "Failed to save security settings")
    } finally {
      setIsSecurityLoading(false)
    }
  }
  
  // Account settings save handler
  const handleAccountSave = async () => {
    setIsAccountLoading(true)
    
    try {
      // Simulate API call with timeout
      await new Promise(resolve => setTimeout(resolve, 800))
      
      toast({
        title: "Account settings updated",
        description: "Your profile has been updated successfully",
        duration: 3000
      })
    } catch (error) {
      console.error("Error saving account settings:", error)
      toast({
        title: "Failed to update account",
        description: "Please try again later",
        variant: "destructive",
        duration: 3000
      })
    } finally {
      setIsAccountLoading(false)
    }
  }
  
  // Appearance settings save handler
  const handleAppearanceSave = async () => {
    setIsAppearanceLoading(true)
    
    try {
      // Simulate API call with timeout
      await new Promise(resolve => setTimeout(resolve, 800))
      
      toast({
        title: "Appearance settings updated",
        description: "Your preferences have been saved",
        duration: 3000
      })
    } catch (error) {
      console.error("Error saving appearance settings:", error)
      toast({
        title: "Failed to update appearance",
        description: "Please try again later",
        variant: "destructive",
        duration: 3000
      })
    } finally {
      setIsAppearanceLoading(false)
    }
  }
  
  // Notifications settings save handler
  const handleNotificationsSave = async () => {
    setIsNotificationsLoading(true)
    
    try {
      // Simulate API call with timeout
      await new Promise(resolve => setTimeout(resolve, 800))
      
      toast({
        title: "Notification settings updated",
        description: "Your preferences have been saved",
        duration: 3000
      })
    } catch (error) {
      console.error("Error saving notification settings:", error)
      toast({
        title: "Failed to update notifications",
        description: "Please try again later",
        variant: "destructive",
        duration: 3000
      })
    } finally {
      setIsNotificationsLoading(false)
    }
  }
  
  // Load theme preference from localStorage when component mounts
  useEffect(() => {
    // Check if we're in the browser environment
    if (typeof window !== 'undefined') {
      // Get stored theme or default to dark
      const storedTheme = localStorage.getItem('theme')
      
      // If theme is explicitly set to 'light', set isDark to false
      if (storedTheme === 'light') {
        setIsDark(false)
        document.documentElement.classList.remove('dark')
      } else {
        // Default to dark theme if not set or is 'dark'
        setIsDark(true)
        document.documentElement.classList.add('dark')
      }
    }
  }, [])
  
  // Function to handle theme toggle
  const handleThemeChange = (checked: boolean) => {
    setIsDark(checked)
    
    if (checked) {
      // Dark theme
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      // Light theme
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
    
    // Show a toast notification
    toast({
      title: `Theme changed to ${checked ? 'dark' : 'light'} mode`,
      description: "Your preference has been saved",
      duration: 2000
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/20 to-black">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-md border-b border-purple-900/30">
        <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center h-16 my-2">
          <Button
                variant="ghost"
                onClick={() => router.push("/apps")}
                className="flex items-center text-gray-300 hover:text-white p-0"
              >
                <ChevronLeft className="h-5 w-5 mr-2" />
                Back to Dashboard
              </Button>
            <div className="mx-auto flex items-center">
            <SettingsIcon className="h-5 w-5 text-purple-400 mr-2" />
              <span className="text-white font-semibold">Settings</span>
            </div>
            <div className="w-24"></div> {/* Spacer to center the title */}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="account" className="w-full">
            <TabsList className="bg-black/40 border border-purple-900/30">
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

            <TabsContent value="account" className="mt-6">
              <div className="grid gap-6">
                <div className="flex items-center gap-6">
                  <Avatar className="w-20 h-20 border-2 border-purple-500/30">
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback>DB</AvatarFallback>
                  </Avatar>
                  <div>
                    <Button variant="outline" className="bg-black/30 border-purple-900/30">
                      Change Avatar
                    </Button>
                  </div>
                </div>

                <Separator className="bg-purple-900/30" />

                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Input 
                      id="name" 
                      value={accountForm.name} 
                      onChange={handleAccountChange}
                      className="bg-black/30 border-purple-900/30" 
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      value={accountForm.email} 
                      onChange={handleAccountChange}
                      className="bg-black/30 border-purple-900/30" 
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={accountForm.bio}
                      onChange={handleAccountChange}
                      placeholder="Tell us about yourself"
                      className="bg-black/30 border-purple-900/30 min-h-[100px]"
                    />
                  </div>
                </div>

                <Separator className="bg-purple-900/30" />

                <div className="flex justify-end">
                  <Button 
                    className="bg-purple-600 hover:bg-purple-700"
                    onClick={handleAccountSave}
                    disabled={isAccountLoading}
                  >
                    {isAccountLoading ? (
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
            </TabsContent>

            <TabsContent value="appearance" className="mt-6">
              <div className="grid gap-6">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <Label>Theme</Label>
                    <span className="text-sm text-gray-400">Select your preferred theme</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sun className={`h-4 w-4 ${!isDark ? 'text-yellow-400' : 'text-gray-400'}`} />
                    <Switch
                      checked={isDark}
                      onCheckedChange={handleThemeChange}
                      className="data-[state=checked]:bg-purple-600"
                    />
                    <Moon className={`h-4 w-4 ${isDark ? 'text-blue-400' : 'text-gray-400'}`} />
                  </div>
                </div>

                <Separator className="bg-purple-900/30" />

                <div className="grid gap-4">
                  <div className="flex flex-col gap-1">
                    <Label>Color Scheme</Label>
                    <span className="text-sm text-gray-400">Choose your preferred color scheme</span>
                  </div>
                  <Select 
                    value={colorScheme}
                    onValueChange={setColorScheme}
                  >
                    <SelectTrigger className="bg-black/30 border-purple-900/30">
                      <SelectValue placeholder="Select color scheme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="purple">Purple</SelectItem>
                      <SelectItem value="blue">Blue</SelectItem>
                      <SelectItem value="green">Green</SelectItem>
                      <SelectItem value="red">Red</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator className="bg-purple-900/30" />

                <div className="flex justify-end">
                  <Button 
                    className="bg-purple-600 hover:bg-purple-700"
                    onClick={handleAppearanceSave}
                    disabled={isAppearanceLoading}
                  >
                    {isAppearanceLoading ? (
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
            </TabsContent>

            <TabsContent value="notifications" className="mt-6">
              <div className="grid gap-6">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <Label>Email Notifications</Label>
                    <span className="text-sm text-gray-400">Receive email notifications about your activity</span>
                  </div>
                  <Switch 
                    checked={notificationSettings.emailNotifications}
                    onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, emailNotifications: checked})}
                    className="data-[state=checked]:bg-purple-600" 
                  />
                </div>

                <Separator className="bg-purple-900/30" />

                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <Label>Push Notifications</Label>
                    <span className="text-sm text-gray-400">Receive push notifications about your activity</span>
                  </div>
                  <Switch 
                    checked={notificationSettings.pushNotifications}
                    onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, pushNotifications: checked})}
                    className="data-[state=checked]:bg-purple-600" 
                  />
                </div>

                <Separator className="bg-purple-900/30" />

                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <Label>Marketing Emails</Label>
                    <span className="text-sm text-gray-400">Receive emails about new features and updates</span>
                  </div>
                  <Switch 
                    checked={notificationSettings.marketingEmails}
                    onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, marketingEmails: checked})}
                    className="data-[state=checked]:bg-purple-600" 
                  />
                </div>

                <Separator className="bg-purple-900/30" />

                <div className="flex justify-end">
                  <Button 
                    className="bg-purple-600 hover:bg-purple-700"
                    onClick={handleNotificationsSave}
                    disabled={isNotificationsLoading}
                  >
                    {isNotificationsLoading ? (
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
            </TabsContent>

            <TabsContent value="security" className="mt-6">
              <div className="grid gap-6">
                <div className="grid gap-4">
                  <div className="flex flex-col gap-1">
                    <Label>Change Password</Label>
                    <span className="text-sm text-gray-400">Update your password to keep your account secure</span>
                  </div>
                  
                  {securityError && (
                    <div className="bg-red-900/20 border border-red-500/50 text-red-200 text-sm p-3 rounded-md">
                      {securityError}
                    </div>
                  )}
                  
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

                <Separator className="bg-purple-900/30" />

                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <Label>Two-Factor Authentication</Label>
                    <span className="text-sm text-gray-400">Add an extra layer of security to your account</span>
                  </div>
                  <Switch 
                    checked={twoFactorEnabled}
                    onCheckedChange={setTwoFactorEnabled}
                    className="data-[state=checked]:bg-purple-600" 
                  />
                </div>

                <Separator className="bg-purple-900/30" />

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
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}

