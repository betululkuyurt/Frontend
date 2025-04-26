"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, User, Moon, Sun, SettingsIcon } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useEffect } from "react" // Add this import

export default function SettingsPage() {
  const [isDark, setIsDark] = useState(true)
  const router = useRouter()
  

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
                    <Input id="name" defaultValue="DBU Team" className="bg-black/30 border-purple-900/30" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" defaultValue="dbu@example.com" className="bg-black/30 border-purple-900/30" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      placeholder="Tell us about yourself"
                      className="bg-black/30 border-purple-900/30 min-h-[100px]"
                    />
                  </div>
                </div>

                <Separator className="bg-purple-900/30" />

                <div className="flex justify-end">
                  <Button className="bg-purple-600 hover:bg-purple-700">Save Changes</Button>
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
                    <Sun className="h-4 w-4 text-gray-400" />
                    <Switch
                      checked={isDark}
                      onCheckedChange={setIsDark}
                      className="data-[state=checked]:bg-purple-600"
                    />
                    <Moon className="h-4 w-4 text-gray-400" />
                  </div>
                </div>

                <Separator className="bg-purple-900/30" />

                <div className="grid gap-4">
                  <div className="flex flex-col gap-1">
                    <Label>Color Scheme</Label>
                    <span className="text-sm text-gray-400">Choose your preferred color scheme</span>
                  </div>
                  <Select defaultValue="purple">
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
                  <Button className="bg-purple-600 hover:bg-purple-700">Save Changes</Button>
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
                  <Switch defaultChecked className="data-[state=checked]:bg-purple-600" />
                </div>

                <Separator className="bg-purple-900/30" />

                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <Label>Push Notifications</Label>
                    <span className="text-sm text-gray-400">Receive push notifications about your activity</span>
                  </div>
                  <Switch defaultChecked className="data-[state=checked]:bg-purple-600" />
                </div>

                <Separator className="bg-purple-900/30" />

                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <Label>Marketing Emails</Label>
                    <span className="text-sm text-gray-400">Receive emails about new features and updates</span>
                  </div>
                  <Switch className="data-[state=checked]:bg-purple-600" />
                </div>

                <Separator className="bg-purple-900/30" />

                <div className="flex justify-end">
                  <Button className="bg-purple-600 hover:bg-purple-700">Save Changes</Button>
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
                  <div className="grid gap-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input id="current-password" type="password" className="bg-black/30 border-purple-900/30" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input id="new-password" type="password" className="bg-black/30 border-purple-900/30" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input id="confirm-password" type="password" className="bg-black/30 border-purple-900/30" />
                  </div>
                </div>

                <Separator className="bg-purple-900/30" />

                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <Label>Two-Factor Authentication</Label>
                    <span className="text-sm text-gray-400">Add an extra layer of security to your account</span>
                  </div>
                  <Switch className="data-[state=checked]:bg-purple-600" />
                </div>

                <Separator className="bg-purple-900/30" />

                <div className="flex justify-end">
                  <Button className="bg-purple-600 hover:bg-purple-700">Save Changes</Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}

