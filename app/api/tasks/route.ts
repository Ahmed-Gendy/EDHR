import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { collection, addDoc, getDocs, query, where, serverTimestamp } from "firebase/firestore"
import { firestore } from "@/lib/firebase"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const { title, description, link, priority, status, dueDate, assignees } = await request.json()

    // Validate required fields
    if (!title || !description || !priority || !status || !assignees || assignees.length === 0) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 })
    }

    // Create task
    const taskRef = await addDoc(collection(firestore, "tasks"), {
      title,
      description,
      link: link || null,
      status,
      priority,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      createdBy: session.id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    // Create task assignments
    for (const employeeId of assignees) {
      await addDoc(collection(firestore, "taskAssignments"), {
        taskId: taskRef.id,
        employeeId,
        assignedAt: serverTimestamp(),
      })
    }

    // Create notifications for assignees
    for (const employeeId of assignees) {
      // Get user ID for the employee
      const usersSnapshot = await getDocs(query(collection(firestore, "users"), where("employeeId", "==", employeeId)))

      if (!usersSnapshot.empty) {
        const userId = usersSnapshot.docs[0].id

        await addDoc(collection(firestore, "notifications"), {
          userId,
          title: "New Task Assigned",
          message: `You have been assigned a new task: ${title}`,
          type: "TASK",
          link: `/tasks/${taskRef.id}`,
          createdAt: serverTimestamp(),
          read: false,
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: "Task created successfully",
      taskId: taskRef.id,
    })
  } catch (error) {
    console.error("Error creating task:", error)
    return NextResponse.json({ success: false, message: "An error occurred while creating the task" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const priority = searchParams.get("priority")
    const assigneeId = searchParams.get("assigneeId")

    let tasksQuery = query(collection(firestore, "tasks"))

    // Apply filters
    if (status) {
      tasksQuery = query(tasksQuery, where("status", "==", status))
    }

    if (priority) {
      tasksQuery = query(tasksQuery, where("priority", "==", priority))
    }

    const tasksSnapshot = await getDocs(tasksQuery)

    // Get all task assignments
    const taskAssignmentsSnapshot = await getDocs(collection(firestore, "taskAssignments"))
    const taskAssignments = taskAssignmentsSnapshot.docs.reduce(
      (acc, doc) => {
        const data = doc.data()
        if (!acc[data.taskId]) {
          acc[data.taskId] = []
        }
        acc[data.taskId].push(data.employeeId)
        return acc
      },
      {} as Record<string, string[]>,
    )

    // Filter by assignee if needed
    let filteredTaskIds = tasksSnapshot.docs.map((doc) => doc.id)

    if (assigneeId) {
      filteredTaskIds = filteredTaskIds.filter((taskId) => {
        const assignees = taskAssignments[taskId] || []
        return assignees.includes(assigneeId)
      })
    }

    // Get all employees
    const employeesSnapshot = await getDocs(collection(firestore, "employees"))
    const employees = employeesSnapshot.docs.reduce(
      (acc, doc) => {
        const data = doc.data()
        acc[doc.id] = {
          name: `${data.firstName} ${data.lastName}`,
        }
        return acc
      },
      {} as Record<string, { name: string }>,
    )

    // Get all users
    const usersSnapshot = await getDocs(collection(firestore, "users"))
    const users = usersSnapshot.docs.reduce(
      (acc, doc) => {
        const data = doc.data()
        acc[doc.id] = {
          employeeId: data.employeeId,
        }
        return acc
      },
      {} as Record<string, { employeeId: string }>,
    )

    // Map tasks with their creators and assignees
    const tasks = tasksSnapshot.docs
      .filter((doc) => filteredTaskIds.includes(doc.id))
      .map((doc) => {
        const task = doc.data()
        const creatorUser = users[task.createdBy] || {}
        const creatorEmployee = creatorUser.employeeId ? employees[creatorUser.employeeId] : null

        // Get assignees for this task
        const assigneeIds = taskAssignments[doc.id] || []
        const assigneeNames = assigneeIds.map((id) => employees[id]?.name || "Unknown").join(", ")

        return {
          id: doc.id,
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          due_date: task.dueDate,
          created_at: task.createdAt?.toDate?.() || new Date(),
          creator_name: creatorEmployee?.name || null,
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

      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    return NextResponse.json({ success: true, tasks })
  } catch (error) {
    console.error("Error fetching tasks:", error)
    return NextResponse.json({ success: false, message: "An error occurred while fetching tasks" }, { status: 500 })
  }
}
