"use client"

import { useState } from "react"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MoreHorizontal, Search, UserPlus, Key, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { deactivateUser, activateUser, sendPasswordReset, type User } from "@/lib/user-service"
import { format } from "date-fns"

interface UserListProps {
  users: User[]
}

export function UserList({ users }: UserListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({})
  const { toast } = useToast()

  const filteredUsers = users.filter((user) => {
    const searchValue = searchTerm.toLowerCase()
    return (
      user.email.toLowerCase().includes(searchValue) ||
      (user.displayName && user.displayName.toLowerCase().includes(searchValue)) ||
      (user.department && user.department.toLowerCase().includes(searchValue)) ||
      (user.position && user.position.toLowerCase().includes(searchValue)) ||
      user.role.toLowerCase().includes(searchValue)
    )
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Active</Badge>
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>
      case "pending":
        return <Badge className="bg-yellow-500">Pending</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "SUPERADMIN":
        return <Badge className="bg-purple-500">Super Admin</Badge>
      case "ADMIN":
        return <Badge className="bg-blue-500">Admin</Badge>
      case "MANAGER":
        return <Badge className="bg-indigo-500">Manager</Badge>
      case "EMPLOYEE":
        return <Badge variant="outline">Employee</Badge>
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  const handleToggleStatus = async (user: User) => {
    setIsLoading((prev) => ({ ...prev, [user.uid]: true }))

    try {
      if (user.status === "active") {
        await deactivateUser(user.uid)
        toast({
          title: "User deactivated",
          description: `${user.displayName || user.email} has been deactivated.`,
        })
      } else {
        await activateUser(user.uid)
        toast({
          title: "User activated",
          description: `${user.displayName || user.email} has been activated.`,
        })
      }

      // Refresh the page to update the user list
      window.location.reload()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user status.",
        variant: "destructive",
      })
    } finally {
      setIsLoading((prev) => ({ ...prev, [user.uid]: false }))
    }
  }

  const handleSendPasswordReset = async (user: User) => {
    setIsLoading((prev) => ({ ...prev, [`reset-${user.uid}`]: true }))

    try {
      await sendPasswordReset(user.email)
      toast({
        title: "Password reset email sent",
        description: `A password reset email has been sent to ${user.email}.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send password reset email.",
        variant: "destructive",
      })
    } finally {
      setIsLoading((prev) => ({ ...prev, [`reset-${user.uid}`]: false }))
    }
  }

  // Helper function to safely format dates
  const formatDate = (dateValue: any): string => {
    if (!dateValue) return "Unknown"

    try {
      // Handle Firebase serverTimestamp reference
      if (dateValue && typeof dateValue === "object" && dateValue._methodName === "serverTimestamp") {
        return "Pending"
      }

      // Handle Firebase server timestamp
      if (dateValue && typeof dateValue === "object" && dateValue.seconds) {
        return format(new Date(dateValue.seconds * 1000), "MMM d, yyyy")
      }

      // Handle numeric timestamp (milliseconds)
      if (typeof dateValue === "number") {
        return format(new Date(dateValue), "MMM d, yyyy")
      }

      // Handle ISO string or Date object
      return format(new Date(dateValue), "MMM d, yyyy")
    } catch (error) {
      console.error("Date formatting error:", error, dateValue)
      return "Invalid date"
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search users..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.uid}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage
                          src={
                            user.photoURL ||
                            `/placeholder.svg?height=40&width=40&text=${user.displayName?.[0] || user.email[0]}`
                          }
                        />
                        <AvatarFallback>{user.displayName?.[0] || user.email[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.displayName || "No name"}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>{user.department || "Not assigned"}</TableCell>
                  <TableCell>{user.position || "Not assigned"}</TableCell>
                  <TableCell>{getStatusBadge(user.status)}</TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Link href={`/users/${user.uid}`} className="w-full flex items-center">
                            <UserPlus className="mr-2 h-4 w-4" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Link href={`/users/${user.uid}/edit`} className="w-full flex items-center">
                            <UserPlus className="mr-2 h-4 w-4" />
                            Edit User
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleSendPasswordReset(user)}
                          disabled={isLoading[`reset-${user.uid}`]}
                        >
                          <div className="w-full flex items-center">
                            <Key className="mr-2 h-4 w-4" />
                            Send Password Reset
                          </div>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleStatus(user)} disabled={isLoading[user.uid]}>
                          <div className="w-full flex items-center">
                            <AlertTriangle className="mr-2 h-4 w-4" />
                            {user.status === "active" ? "Deactivate User" : "Activate User"}
                          </div>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
