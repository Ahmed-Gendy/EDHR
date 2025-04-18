import { requireAuth } from "@/lib/auth"
import { DashboardShell } from "@/components/ui/dashboard-shell"
import { TaskList } from "@/components/task-list"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ref, get } from "firebase/database"
import { database } from "@/lib/firebase"

async function getTasks() {
  const tasksRef = ref(database, "tasks")
  const snapshot = await get(tasksRef)

  if (!snapshot.exists()) {
    return []
  }

  // Get all employees for assignee names
  const employeesRef = ref(database, "employees")
  const employeesSnapshot = await get(employeesRef)
  const employees = employeesSnapshot.exists() ? employeesSnapshot.val() : {}

  // Transform the data to match the expected format
  const tasks = Object.entries(snapshot.val()).map(([id, data]) => {
    const task = data as any

    // Get assignee names
    const assigneeIds = task.assignees ? Object.keys(task.assignees) : []
    const assigneeNames = assigneeIds
      .map((id) => {
        const employee = employees[id]
        return employee ? `${employee.firstName} ${employee.lastName}` : "Unknown"
      })
      .join(", ")

    return {
      id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      due_date: task.dueDate,
      created_at: task.createdAt,
      assignees: assigneeNames,
    }
  })

  // Sort tasks by priority and due date
  tasks.sort((a, b) => {
    const priorityOrder = { URGENT: 1, HIGH: 2, MEDIUM: 3, LOW: 4 }
    const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 5
    const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 5

    if (aPriority !== bPriority) {
      return aPriority - bPriority
    }

    if (a.due_date && b.due_date) {
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
    }

    if (a.due_date) return -1
    if (b.due_date) return 1

    return 0
  })

  return tasks
}

export default async function TasksPage() {
  await requireAuth()
  const tasks = await getTasks()

  return (
    <DashboardShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Tasks</h1>
        <Button asChild>
          <Link href="/tasks/new">Create Task</Link>
        </Button>
      </div>
      <TaskList tasks={tasks} />
    </DashboardShell>
  )
}
