import { requireAuth } from "@/lib/auth"
import { DashboardShell } from "@/components/ui/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { LeaveRequestList } from "@/components/leave-request-list"
import { ref, get } from "firebase/database"
import { database } from "@/lib/firebase"

async function getLeaveRequests() {
  // Get all leave requests
  const leaveRequestsRef = ref(database, "leaveRequests")
  const leaveRequestsSnapshot = await get(leaveRequestsRef)

  const leaveRequests: any[] = []

  if (leaveRequestsSnapshot.exists()) {
    // Get all employees for mapping names
    const employeesRef = ref(database, "employees")
    const employeesSnapshot = await get(employeesRef)
    const employees: Record<string, any> = {}

    if (employeesSnapshot.exists()) {
      employeesSnapshot.forEach((childSnapshot) => {
        const employee = childSnapshot.val()
        employees[childSnapshot.key as string] = employee
      })
    }

    // Get all leave types
    const leaveTypesRef = ref(database, "leaveTypes")
    const leaveTypesSnapshot = await get(leaveTypesRef)
    const leaveTypes: Record<string, any> = {}

    if (leaveTypesSnapshot.exists()) {
      leaveTypesSnapshot.forEach((childSnapshot) => {
        const leaveType = childSnapshot.val()
        leaveTypes[childSnapshot.key as string] = leaveType
      })
    }

    // Get all users for approved_by mapping
    const usersRef = ref(database, "users")
    const usersSnapshot = await get(usersRef)
    const users: Record<string, any> = {}

    if (usersSnapshot.exists()) {
      usersSnapshot.forEach((childSnapshot) => {
        const user = childSnapshot.val()
        users[childSnapshot.key as string] = user
      })
    }

    // Map leave requests with employee names, leave types, and approver names
    leaveRequestsSnapshot.forEach((childSnapshot) => {
      const leaveRequest = childSnapshot.val()
      const employee = employees[leaveRequest.employeeId] || {}
      const leaveType = leaveTypes[leaveRequest.leaveTypeId] || {}
      const approver = leaveRequest.approvedBy ? users[leaveRequest.approvedBy] : null
      const approverEmployee = approver?.employeeId ? employees[approver.employeeId] : null

      leaveRequests.push({
        id: childSnapshot.key,
        employee_name:
          employee.firstName && employee.lastName ? `${employee.firstName} ${employee.lastName}` : "Unknown",
        leave_type: leaveType.name || "Unknown",
        start_date: leaveRequest.startDate,
        end_date: leaveRequest.endDate,
        reason: leaveRequest.reason,
        status: leaveRequest.status,
        approved_by: approverEmployee ? `${approverEmployee.firstName} ${approverEmployee.lastName}` : null,
        created_at: leaveRequest.createdAt,
      })
    })
  }

  // Sort leave requests by status and created_at
  leaveRequests.sort((a, b) => {
    const statusOrder: Record<string, number> = {
      PENDING: 1,
      APPROVED: 2,
      REJECTED: 3,
      CANCELLED: 4,
    }

    const aOrder = statusOrder[a.status] || 5
    const bOrder = statusOrder[b.status] || 5

    if (aOrder !== bOrder) {
      return aOrder - bOrder
    }

    // Sort by created_at in descending order
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  return leaveRequests
}

export default async function LeaveRequestsPage() {
  await requireAuth()
  const leaveRequests = await getLeaveRequests()

  return (
    <DashboardShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Leave Requests</h1>
        <Link href="/leave-requests/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Request
          </Button>
        </Link>
      </div>
      <LeaveRequestList leaveRequests={leaveRequests} />
    </DashboardShell>
  )
}
