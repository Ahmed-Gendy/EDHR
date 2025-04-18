"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, MoreHorizontal, FileEdit, Trash2, FileText, Calendar, BarChart2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { subscribeToRecords } from "@/lib/database"

interface Worker {
  id: string
  first_name: string
  last_name: string
  phone: string
  specialization: string
  daily_rate: number
  status: string
  hire_date: string
  bank_name?: string
  account_number?: string
  notes?: string
}

export function DailyWorkerList() {
  const [workers, setWorkers] = useState<Worker[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    // Subscribe to real-time updates
    const unsubscribe = subscribeToRecords("dailyWorkers", (data) => {
      const formattedWorkers = data
        .filter((worker) => !worker.deleted)
        .map((worker) => ({
          id: worker.id,
          first_name: worker.firstName,
          last_name: worker.lastName,
          phone: worker.phone || "",
          specialization: worker.specialization || "",
          daily_rate: worker.dailyRate || 0,
          status: worker.status || "ACTIVE",
          hire_date: worker.hireDate || new Date().toISOString().split("T")[0],
          bank_name: worker.bankName || null,
          account_number: worker.accountNumber || null,
          notes: worker.notes || null,
        }))
      setWorkers(formattedWorkers)
      setIsLoading(false)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const filteredWorkers = workers.filter((worker) => {
    const searchValue = searchTerm.toLowerCase()
    return (
      worker.first_name.toLowerCase().includes(searchValue) ||
      worker.last_name.toLowerCase().includes(searchValue) ||
      worker.phone.toLowerCase().includes(searchValue) ||
      worker.specialization.toLowerCase().includes(searchValue)
    )
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-green-500">Active</Badge>
      case "INACTIVE":
        return <Badge variant="secondary">Inactive</Badge>
      case "ON_LEAVE":
        return <Badge className="bg-yellow-500">On Leave</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const handleDeleteWorker = async (workerId: string) => {
    if (!confirm("Are you sure you want to delete this worker?")) {
      return
    }

    try {
      const response = await fetch(`/api/daily-workers/${workerId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete worker")
      }

      toast({
        title: "Worker Deleted",
        description: "The worker has been deleted successfully.",
      })
    } catch (error) {
      console.error("Error deleting worker:", error)
      toast({
        title: "Error",
        description: "An error occurred while deleting the worker.",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading workers...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search workers..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Link href="/daily-workers/new">
          <Button>Add Worker</Button>
        </Link>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Specialization</TableHead>
              <TableHead>Daily Rate</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Hire Date</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredWorkers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No workers found
                </TableCell>
              </TableRow>
            ) : (
              filteredWorkers.map((worker) => (
                <TableRow key={worker.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{`${worker.first_name} ${worker.last_name}`}</p>
                    </div>
                  </TableCell>
                  <TableCell>{worker.specialization}</TableCell>
                  <TableCell>${worker.daily_rate.toFixed(2)}</TableCell>
                  <TableCell>{getStatusBadge(worker.status)}</TableCell>
                  <TableCell>{worker.phone}</TableCell>
                  <TableCell>{new Date(worker.hire_date).toLocaleDateString()}</TableCell>
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
                          <Link href={`/daily-workers/${worker.id}`} className="w-full flex items-center">
                            <FileText className="mr-2 h-4 w-4" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Link href={`/daily-workers/${worker.id}/edit`} className="w-full flex items-center">
                            <FileEdit className="mr-2 h-4 w-4" />
                            Edit Worker
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Link href={`/daily-workers/${worker.id}/attendance`} className="w-full flex items-center">
                            <Calendar className="mr-2 h-4 w-4" />
                            Attendance History
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Link href={`/daily-workers/${worker.id}/performance`} className="w-full flex items-center">
                            <BarChart2 className="mr-2 h-4 w-4" />
                            Performance
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteWorker(worker.id)}>
                          <div className="w-full flex items-center text-red-500">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Worker
                          </div>
                        </DropdownMenuItem>
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
