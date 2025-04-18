"use client"

import { useState } from "react"
import { format, parseISO, differenceInDays } from "date-fns"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"

interface LeaveRequest {
  id: number
  employee_name: string
  leave_type: string
  start_date: string
  end_date: string
  reason: string
  status: string
  approved_by: string | null
  created_at: string
}

interface LeaveRequestListProps {
  leaveRequests: LeaveRequest[]
}

export function LeaveRequestList({ leaveRequests }: LeaveRequestListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

  const filteredRequests = leaveRequests.filter((request) => {
    const searchValue = searchTerm.toLowerCase()
    const matchesSearch =
      request.employee_name.toLowerCase().includes(searchValue) ||
      request.leave_type.toLowerCase().includes(searchValue) ||
      request.reason.toLowerCase().includes(searchValue)

    const matchesStatus = statusFilter ? request.status === statusFilter : true

    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline">Pending</Badge>
      case "APPROVED":
        return <Badge className="bg-green-500">Approved</Badge>
      case "REJECTED":
        return <Badge variant="destructive">Rejected</Badge>
      case "CANCELLED":
        return <Badge variant="secondary">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const calculateDuration = (startDate: string, endDate: string) => {
    const start = parseISO(startDate)
    const end = parseISO(endDate)
    const days = differenceInDays(end, start) + 1 // Include both start and end days
    return days === 1 ? "1 day" : `${days} days`
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search leave requests..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={statusFilter === null ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(null)}
          >
            All
          </Button>
          <Button
            variant={statusFilter === "PENDING" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("PENDING")}
          >
            Pending
          </Button>
          <Button
            variant={statusFilter === "APPROVED" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("APPROVED")}
          >
            Approved
          </Button>
          <Button
            variant={statusFilter === "REJECTED" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("REJECTED")}
          >
            Rejected
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Leave Type</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No leave requests found
                </TableCell>
              </TableRow>
            ) : (
              filteredRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>{request.employee_name}</TableCell>
                  <TableCell>{request.leave_type}</TableCell>
                  <TableCell>{calculateDuration(request.start_date, request.end_date)}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{format(parseISO(request.start_date), "MMM d, yyyy")}</span>
                      <span className="text-muted-foreground">to</span>
                      <span>{format(parseISO(request.end_date), "MMM d, yyyy")}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell>
                    <p className="max-w-[200px] truncate" title={request.reason}>
                      {request.reason}
                    </p>
                  </TableCell>
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
                          <Link href={`/leave-requests/${request.id}`} className="w-full">
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        {request.status === "PENDING" && (
                          <>
                            <DropdownMenuItem>
                              <Link href={`/leave-requests/${request.id}/approve`} className="w-full">
                                Approve
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Link href={`/leave-requests/${request.id}/reject`} className="w-full">
                                Reject
                              </Link>
                            </DropdownMenuItem>
                          </>
                        )}
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
