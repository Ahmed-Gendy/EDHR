"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  BarChart3,
  Building2,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
  UserCog,
  HardHat,
  DollarSign,
  Building,
  Clock,
  CreditCard,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState, useCallback } from "react"
import { logout } from "@/lib/auth"

const sidebarLinks = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
    roles: ["EMPLOYEE", "MANAGER", "ADMIN", "SUPERADMIN"],
  },
  {
    title: "Employees",
    href: "/employees",
    icon: <Users className="h-5 w-5" />,
    roles: ["MANAGER", "ADMIN", "SUPERADMIN"],
  },
  {
    title: "Daily Workers",
    href: "/daily-workers",
    icon: <HardHat className="h-5 w-5" />,
    roles: ["MANAGER", "ADMIN", "SUPERADMIN"],
  },
  {
    title: "Construction Sites",
    href: "/construction-sites",
    icon: <Building className="h-5 w-5" />,
    roles: ["MANAGER", "ADMIN", "SUPERADMIN"],
  },
  {
    title: "User Management",
    href: "/users",
    icon: <UserCog className="h-5 w-5" />,
    roles: ["ADMIN", "SUPERADMIN"],
  },
  {
    title: "Departments",
    href: "/departments",
    icon: <Building2 className="h-5 w-5" />,
    roles: ["MANAGER", "ADMIN", "SUPERADMIN"],
  },
  {
    title: "Tasks",
    href: "/tasks",
    icon: <ClipboardList className="h-5 w-5" />,
    roles: ["EMPLOYEE", "MANAGER", "ADMIN", "SUPERADMIN"],
  },
  {
    title: "Attendance",
    href: "/attendance",
    icon: <Clock className="h-5 w-5" />,
    roles: ["EMPLOYEE", "MANAGER", "ADMIN", "SUPERADMIN"],
  },
  {
    title: "Leave Requests",
    href: "/leave-requests",
    icon: <FileText className="h-5 w-5" />,
    roles: ["EMPLOYEE", "MANAGER", "ADMIN", "SUPERADMIN"],
  },
  {
    title: "Payroll",
    href: "/payroll",
    icon: <DollarSign className="h-5 w-5" />,
    roles: ["MANAGER", "ADMIN", "SUPERADMIN"],
  },
  {
    title: "Bank Accounts",
    href: "/bank-accounts",
    icon: <CreditCard className="h-5 w-5" />,
    roles: ["ADMIN", "SUPERADMIN"],
  },
  {
    title: "Performance",
    href: "/performance",
    icon: <BarChart3 className="h-5 w-5" />,
    roles: ["MANAGER", "ADMIN", "SUPERADMIN"],
  },
  {
    title: "Settings",
    href: "/settings",
    icon: <Settings className="h-5 w-5" />,
    roles: ["EMPLOYEE", "MANAGER", "ADMIN", "SUPERADMIN"],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [userRole, setUserRole] = useState<string | null>(null)

  const fetchSession = useCallback(() => {
    try {
      const sessionStr = localStorage.getItem("session")
      if (sessionStr) {
        const session = JSON.parse(sessionStr)
        setUserRole(session.role)
      }
    } catch (error) {
      console.error("Error parsing session:", error)
    }
  }, [])

  useEffect(() => {
    // Get the user's role from localStorage

    fetchSession()

    // Add event listener for storage changes
    window.addEventListener("storage", fetchSession)

    return () => {
      window.removeEventListener("storage", fetchSession)
    }
  }, [fetchSession])

  // Filter sidebar links based on user role
  const filteredLinks = userRole ? sidebarLinks.filter((link) => link.roles.includes(userRole)) : []

  const handleLogout = useCallback(async () => {
    try {
      const result = await logout()
      if (result.success) {
        router.push("/login")
      } else {
        console.error("Logout failed:", result.message)
      }
    } catch (error) {
      console.error("Error during logout:", error)
    }
  }, [router])

  return (
    <div className="hidden md:flex flex-col w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="p-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-8 w-8 relative">
            <img src="/logo.png" alt="EDECS HR Logo" className="h-full w-full object-contain" />
          </div>
          <span className="font-bold text-xl">EDECS HR</span>
        </Link>
      </div>
      <div className="flex-1 px-4 space-y-1 overflow-y-auto">
        {filteredLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
              pathname === link.href
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "hover:bg-sidebar-accent/10",
            )}
          >
            {link.icon}
            <span>{link.title}</span>
          </Link>
        ))}
      </div>
      <div className="p-4 border-t border-sidebar-border">
        <Button
          variant="ghost"
          className="w-full flex items-center gap-3 text-sidebar-foreground hover:bg-sidebar-accent/10"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          <span>Log out</span>
        </Button>
      </div>
    </div>
  )
}
