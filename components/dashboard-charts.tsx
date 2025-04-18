"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"

interface DepartmentDistribution {
  name: string
  count: number
}

interface TaskStatusDistribution {
  status: string
  count: number
}

interface DashboardChartsProps {
  departmentDistribution: DepartmentDistribution[]
  taskStatusDistribution: TaskStatusDistribution[]
}

export function DashboardCharts({ departmentDistribution, taskStatusDistribution }: DashboardChartsProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Department Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              <p className="text-muted-foreground">Loading chart...</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Task Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              <p className="text-muted-foreground">Loading chart...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Department Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            {departmentDistribution.length > 0 ? (
              <div className="space-y-4">
                {departmentDistribution.map((dept) => (
                  <div key={dept.name} className="flex items-center">
                    <div className="w-1/3 font-medium truncate">{dept.name}</div>
                    <div className="w-2/3 flex items-center gap-2">
                      <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-primary h-full"
                          style={{
                            width: `${
                              (dept.count / departmentDistribution.reduce((acc, curr) => acc + curr.count, 0)) * 100
                            }%`,
                          }}
                        />
                      </div>
                      <div className="w-10 text-right text-sm">{dept.count}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-muted-foreground">No department data available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Task Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            {taskStatusDistribution.length > 0 ? (
              <div className="space-y-4">
                {taskStatusDistribution.map((task) => (
                  <div key={task.status} className="flex items-center">
                    <div className="w-1/3 font-medium truncate">
                      {task.status.charAt(0) + task.status.slice(1).toLowerCase().replace("_", " ")}
                    </div>
                    <div className="w-2/3 flex items-center gap-2">
                      <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full ${
                            task.status === "COMPLETED"
                              ? "bg-green-500"
                              : task.status === "IN_PROGRESS"
                                ? "bg-blue-500"
                                : task.status === "PENDING"
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                          }`}
                          style={{
                            width: `${
                              (task.count / taskStatusDistribution.reduce((acc, curr) => acc + curr.count, 0)) * 100
                            }%`,
                          }}
                        />
                      </div>
                      <div className="w-10 text-right text-sm">{task.count}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-muted-foreground">No task data available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
