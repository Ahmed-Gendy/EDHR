"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardShell } from "@/components/ui/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, ClipboardList, Calendar, FileText } from "lucide-react"
import { DashboardCharts } from "@/components/dashboard-charts"
import { ref, get } from "firebase/database"
import { database, auth } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    employeeCount: 0,
    taskCount: 0,
    attendanceCount: 0,
    leaveRequestCount: 0,
    departmentDistribution: [],
    taskStatusDistribution: [],
  })
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true)
        fetchDashboardStats()
      } else {
        setIsAuthenticated(false)
        router.push("/login")
      }
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [router])

  const fetchDashboardStats = async () => {
    try {
      // Get employee count
      const employeesRef = ref(database, "employees")
      const employeesSnapshot = await get(employeesRef)

      let employeeCount = 0
      const activeEmployees = []

      if (employeesSnapshot.exists()) {
        employeesSnapshot.forEach((childSnapshot) => {
          const employee = childSnapshot.val()
          if (employee.status === "ACTIVE") {
            employeeCount++
            activeEmployees.push({
              id: childSnapshot.key,
              ...employee,
            })
          }
        })
      }

      // Get task count
      const tasksRef = ref(database, "tasks")
      const tasksSnapshot = await get(tasksRef)

      let taskCount = 0
      const tasks = []

      if (tasksSnapshot.exists()) {
        tasksSnapshot.forEach((childSnapshot) => {
          taskCount++
          tasks.push({
            id: childSnapshot.key,
            ...childSnapshot.val(),
          })
        })
      }

      // Get attendance count for today
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayStr = today.toISOString().split("T")[0]

      const attendanceRef = ref(database, "attendance")
      const attendanceSnapshot = await get(attendanceRef)

      let attendanceCount = 0

      if (attendanceSnapshot.exists()) {
        attendanceSnapshot.forEach((childSnapshot) => {
          const attendance = childSnapshot.val()
          if (attendance.date && attendance.date.split("T")[0] === todayStr) {
            attendanceCount++
          }
        })
      }

      // Get pending leave requests
      const leaveRequestsRef = ref(database, "leaveRequests")
      const leaveRequestsSnapshot = await get(leaveRequestsRef)

      let leaveRequestCount = 0

      if (leaveRequestsSnapshot.exists()) {
        leaveRequestsSnapshot.forEach((childSnapshot) => {
          const leaveRequest = childSnapshot.val()
          if (leaveRequest.status === "PENDING") {
            leaveRequestCount++
          }
        })
      }

      // Get department distribution
      const departmentsRef = ref(database, "departments")
      const departmentsSnapshot = await get(departmentsRef)

      const departmentDistribution = []

      if (departmentsSnapshot.exists()) {
        const departments = {}

        // Initialize departments
        departmentsSnapshot.forEach((childSnapshot) => {
          const department = childSnapshot.val()
          departments[childSnapshot.key] = {
            name: department.name,
            count: 0,
          }
        })

        // Count employees per department
        for (const employee of activeEmployees) {
          if (employee.department && departments[employee.department]) {
            departments[employee.department].count++
          }
        }

        // Convert to array
        Object.values(departments).forEach((dept) => {
          departmentDistribution.push({
            name: dept.name,
            count: dept.count,
          })
        })
      }

      // Get task status distribution
      const taskStatusDistribution = []
      const taskStatuses = ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]

      // Initialize counts
      const statusCounts = {}
      taskStatuses.forEach((status) => {
        statusCounts[status] = 0
      })

      // Count tasks by status
      tasks.forEach((task) => {
        if (task.status && statusCounts[task.status] !== undefined) {
          statusCounts[task.status]++
        }
      })

      // Convert to array
      taskStatuses.forEach((status) => {
        taskStatusDistribution.push({
          status,
          count: statusCounts[status],
        })
      })

      setStats({
        employeeCount,
        taskCount,
        attendanceCount,
        leaveRequestCount,
        departmentDistribution,
        taskStatusDistribution,
      })
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
    }
  }

  if (isLoading) {
    return <DashboardSkeleton />
  }

  if (!isAuthenticated) {
    return null // This will never render because we redirect in the useEffect
  }

  return (
    <DashboardShell>
      <div className="grid gap-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.employeeCount}</div>
              <p className="text-xs text-muted-foreground">Active employees in the system</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.taskCount}</div>
              <p className="text-xs text-muted-foreground">Tasks currently in the system</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Today's Attendance</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.attendanceCount}</div>
              <p className="text-xs text-muted-foreground">Employees checked in today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Leave Requests</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.leaveRequestCount}</div>
              <p className="text-xs text-muted-foreground">Requests awaiting approval</p>
            </CardContent>
          </Card>
        </div>

        {/* Pass the chart data to a client component */}
        <DashboardCharts
          departmentDistribution={stats.departmentDistribution}
          taskStatusDistribution={stats.taskStatusDistribution}
        />
      </div>
    </DashboardShell>
  )
}

function DashboardSkeleton() {
  return (
    <DashboardShell>
      <div className="grid gap-6">
        <Skeleton className="h-10 w-40" />

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-12 mb-1" />
                  <Skeleton className="h-4 w-32" />
                </CardContent>
              </Card>
            ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  )
}
