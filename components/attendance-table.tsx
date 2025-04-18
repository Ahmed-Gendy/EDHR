"use client"

import { useState } from "react"
import { format, parseISO } from "date-fns"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Clock, CheckCircle, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AttendanceRecord {
  id: number | null
  employee_id: number
  first_name: string
  last_name: string
  department_name: string | null
  check_in: string | null
  check_out: string | null
  status: string | null
}

interface AttendanceTableProps {
  attendance: AttendanceRecord[]
  date: string
}

export function AttendanceTable({ attendance, date }: AttendanceTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState<Record<number, boolean>>({})
  const { toast } = useToast()

  const filteredAttendance = attendance.filter((record) => {
    const searchValue = searchTerm.toLowerCase()
    return (
      record.first_name.toLowerCase().includes(searchValue) ||
      record.last_name.toLowerCase().includes(searchValue) ||
      (record.department_name && record.department_name.toLowerCase().includes(searchValue))
    )
  })

  const handleCheckIn = async (employeeId: number) => {
    setLoading((prev) => ({ ...prev, [employeeId]: true }))

    try {
      const response = await fetch("/api/attendance/check-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId,
          date,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to check in")
      }

      toast({
        title: "Check-in recorded",
        description: `Check-in time: ${format(new Date(), "h:mm a")}`,
      })

      // Update the UI
      window.location.reload()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading((prev) => ({ ...prev, [employeeId]: false }))
    }
  }

  const handleCheckOut = async (employeeId: number) => {
    setLoading((prev) => ({ ...prev, [employeeId]: true }))

    try {
      const response = await fetch("/api/attendance/check-out", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId,
          date,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to check out")
      }

      toast({
        title: "Check-out recorded",
        description: `Check-out time: ${format(new Date(), "h:mm a")}`,
      })

      // Update the UI
      window.location.reload()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading((prev) => ({ ...prev, [employeeId]: false }))
    }
  }

  const getStatusBadge = (status: string | null) => {
    if (!status) return null

    switch (status) {
      case "PRESENT":
        return <Badge className="bg-green-500">Present</Badge>
      case "ABSENT":
        return <Badge variant="destructive">Absent</Badge>
      case "LATE":
        return <Badge className="bg-yellow-500">Late</Badge>
      case "HALF_DAY":
        return <Badge className="bg-orange-500">Half Day</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search employees..."
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
              <TableHead>Employee</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Check In</TableHead>
              <TableHead>Check Out</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAttendance.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No employees found
                </TableCell>
              </TableRow>
            ) : (
              filteredAttendance.map((record) => (
                <TableRow key={record.employee_id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {record.first_name} {record.last_name}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{record.department_name || "Not assigned"}</TableCell>
                  <TableCell>
                    {record.check_in ? (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{format(parseISO(record.check_in), "h:mm a")}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Not checked in</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {record.check_out ? (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{format(parseISO(record.check_out), "h:mm a")}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Not checked out</span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(record.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {!record.check_in ? (
                        <Button
                          size="sm"
                          onClick={() => handleCheckIn(record.employee_id)}
                          disabled={loading[record.employee_id]}
                          className="flex items-center gap-1"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Check In
                        </Button>
                      ) : !record.check_out ? (
                        <Button
                          size="sm"
                          onClick={() => handleCheckOut(record.employee_id)}
                          disabled={loading[record.employee_id]}
                          className="flex items-center gap-1"
                        >
                          <XCircle className="h-4 w-4" />
                          Check Out
                        </Button>
                      ) : (
                        <span className="text-sm text-muted-foreground">Completed</span>
                      )}
                    </div>
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
