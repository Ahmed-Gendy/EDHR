import { requireAuth } from "@/lib/auth"
import { DashboardShell } from "@/components/ui/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { EmployeeList } from "@/components/employee-list"
import { collection, getDocs, query } from "firebase/firestore"
import { firestore } from "@/lib/firebase"

async function getEmployees() {
  // Get all employees
  const employeesSnapshot = await getDocs(query(collection(firestore, "employees")))

  // Get all positions
  const positionsSnapshot = await getDocs(collection(firestore, "positions"))
  const positions = positionsSnapshot.docs.reduce(
    (acc, doc) => {
      acc[doc.id] = { ...doc.data() }
      return acc
    },
    {} as Record<string, any>,
  )

  // Get all departments
  const departmentsSnapshot = await getDocs(collection(firestore, "departments"))
  const departments = departmentsSnapshot.docs.reduce(
    (acc, doc) => {
      acc[doc.id] = { ...doc.data() }
      return acc
    },
    {} as Record<string, any>,
  )

  // Map employees with their position and department
  const employees = employeesSnapshot.docs.map((doc) => {
    const employee = doc.data()
    const position = positions[employee.positionId] || {}
    const department = position.departmentId ? departments[position.departmentId] : null

    return {
      id: doc.id,
      first_name: employee.firstName,
      last_name: employee.lastName,
      email: employee.email,
      phone: employee.phone || "",
      department_name: department?.name || null,
      position_title: position?.title || null,
      status: employee.status,
    }
  })

  return employees
}

export default async function EmployeesPage() {
  await requireAuth()
  const employees = await getEmployees()

  return (
    <DashboardShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Employees</h1>
        <Link href="/employees/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
        </Link>
      </div>
      <EmployeeList employees={employees} />
    </DashboardShell>
  )
}
