import { requireRole } from "@/lib/auth"
import { DashboardShell } from "@/components/ui/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { UserList } from "@/components/user-list"
import { getAllUsers } from "@/lib/user-service"

export default async function UsersPage() {
  // Only allow admins to access this page
  await requireRole(["ADMIN", "SUPERADMIN"])
  const users = await getAllUsers()

  return (
    <DashboardShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">User Management</h1>
        <Link href="/users/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </Link>
      </div>
      <UserList users={users} />
    </DashboardShell>
  )
}
