import { requireAuth } from "@/lib/auth"
import { TaskForm } from "@/components/task-form"
import { ref, get } from "firebase/database"
import { database } from "@/lib/firebase"

async function getEmployees() {
  try {
    const employeesRef = ref(database, "employees")
    const snapshot = await get(employeesRef)

    if (!snapshot.exists()) {
      return []
    }

    const employees = []
    snapshot.forEach((childSnapshot) => {
      const employee = childSnapshot.val()
      employees.push({
        id: childSnapshot.key,
        name: `${employee.firstName} ${employee.lastName}`,
        department: employee.department || null,
      })
    })

    return employees
  } catch (error) {
    console.error("Error fetching employees:", error)
    return []
  }
}

export default async function NewTaskPage() {
  await requireAuth()
  const employees = await getEmployees()

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Create New Task</h1>
      <TaskForm employees={employees} />
    </div>
  )
}
