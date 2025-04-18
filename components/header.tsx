"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bell, Menu, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

export function Header() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const pathname = usePathname()

  // Get the current page title from the pathname
  const getPageTitle = () => {
    const path = pathname.split("/")[1]
    if (!path) return "Home"
    return path.charAt(0).toUpperCase() + path.slice(1)
  }

  return (
    <header className="flex h-16 items-center gap-4 border-b bg-background px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="grid gap-4 py-4">
            <div className="px-4 py-2 border-b flex items-center gap-2">
              <div className="h-8 w-8 relative">
                <img src="/logo.png" alt="EDECS HR Logo" className="h-full w-full object-contain" />
              </div>
              <h2 className="text-lg font-semibold">EDECS HR</h2>
            </div>
            {/* Mobile navigation links */}
            <div className="grid gap-1 px-2">
              <Link href="/dashboard" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent">
                Dashboard
              </Link>
              <Link href="/employees" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent">
                Employees
              </Link>
              <Link href="/tasks" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent">
                Tasks
              </Link>
              <Link href="/attendance" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent">
                Attendance
              </Link>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex-1">
        <h1 className="text-lg font-semibold">{getPageTitle()}</h1>
      </div>

      <div className="flex items-center gap-4">
        {isSearchOpen ? (
          <div className="flex items-center gap-2">
            <Input type="search" placeholder="Search..." className="w-[200px] md:w-[300px]" autoFocus />
            <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(false)}>
              <X className="h-5 w-5" />
              <span className="sr-only">Close search</span>
            </Button>
          </div>
        ) : (
          <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(true)}>
            <Search className="h-5 w-5" />
            <span className="sr-only">Search</span>
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                3
              </Badge>
              <span className="sr-only">Notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              <div className="flex flex-col gap-1">
                <p className="font-medium">New task assigned</p>
                <p className="text-sm text-muted-foreground">
                  You have been assigned a new task: "Update employee records"
                </p>
                <p className="text-xs text-muted-foreground">2 minutes ago</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <div className="flex flex-col gap-1">
                <p className="font-medium">Leave request approved</p>
                <p className="text-sm text-muted-foreground">Your leave request has been approved</p>
                <p className="text-xs text-muted-foreground">1 hour ago</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <div className="flex flex-col gap-1">
                <p className="font-medium">Performance review scheduled</p>
                <p className="text-sm text-muted-foreground">Your performance review is scheduled for next week</p>
                <p className="text-xs text-muted-foreground">1 day ago</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-center">
              <Link href="/notifications" className="w-full text-primary">
                View all notifications
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar>
                <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
                <AvatarFallback>AG</AvatarFallback>
              </Avatar>
              <span className="sr-only">User menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Link href="/profile" className="w-full">
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href="/settings" className="w-full">
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <form action="/api/auth/logout" method="POST">
              <DropdownMenuItem asChild>
                <button className="w-full text-left cursor-pointer">Log out</button>
              </DropdownMenuItem>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
