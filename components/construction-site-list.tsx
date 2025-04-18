"use client"

import { useState } from "react"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Search } from "lucide-react"
import { format } from "date-fns"

interface ConstructionSite {
  id: number | string
  name: string
  location: string
  client: string
  start_date: string
  end_date: string
  status: string
  budget: number
  manager_name: string | null
  progress: number
}

interface ConstructionSiteListProps {
  sites: ConstructionSite[]
}

export function ConstructionSiteList({ sites }: ConstructionSiteListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

  const filteredSites = sites.filter((site) => {
    const searchValue = searchTerm.toLowerCase()
    const matchesSearch =
      site.name.toLowerCase().includes(searchValue) ||
      site.location.toLowerCase().includes(searchValue) ||
      site.client.toLowerCase().includes(searchValue) ||
      (site.manager_name && site.manager_name.toLowerCase().includes(searchValue))

    const matchesStatus = statusFilter ? site.status === statusFilter : true

    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PLANNING":
        return <Badge variant="outline">Planning</Badge>
      case "IN_PROGRESS":
        return <Badge className="bg-blue-500">In Progress</Badge>
      case "COMPLETED":
        return <Badge className="bg-green-500">Completed</Badge>
      case "ON_HOLD":
        return <Badge className="bg-yellow-500">On Hold</Badge>
      case "CANCELLED":
        return <Badge variant="secondary">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search sites..."
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
            variant={statusFilter === "PLANNING" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("PLANNING")}
          >
            Planning
          </Button>
          <Button
            variant={statusFilter === "IN_PROGRESS" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("IN_PROGRESS")}
          >
            In Progress
          </Button>
          <Button
            variant={statusFilter === "COMPLETED" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("COMPLETED")}
          >
            Completed
          </Button>
          <Button
            variant={statusFilter === "ON_HOLD" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("ON_HOLD")}
          >
            On Hold
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Site Name</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Timeline</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Budget</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSites.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No construction sites found
                </TableCell>
              </TableRow>
            ) : (
              filteredSites.map((site) => (
                <TableRow key={site.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{site.name}</p>
                      <p className="text-sm text-muted-foreground">Manager: {site.manager_name || "Unassigned"}</p>
                    </div>
                  </TableCell>
                  <TableCell>{site.location}</TableCell>
                  <TableCell>{site.client}</TableCell>
                  <TableCell>{getStatusBadge(site.status)}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{format(new Date(site.start_date), "MMM d, yyyy")}</span>
                      <span className="text-muted-foreground">to</span>
                      <span>{format(new Date(site.end_date), "MMM d, yyyy")}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-primary h-2.5 rounded-full" style={{ width: `${site.progress}%` }}></div>
                    </div>
                    <p className="text-xs text-right mt-1">{site.progress}%</p>
                  </TableCell>
                  <TableCell>${site.budget.toLocaleString()}</TableCell>
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
                          <Link href={`/construction-sites/${site.id}`} className="w-full">
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Link href={`/construction-sites/${site.id}/edit`} className="w-full">
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Link href={`/construction-sites/${site.id}/workers`} className="w-full">
                            Manage Workers
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Link href={`/construction-sites/${site.id}/delays`} className="w-full">
                            Manage Delays
                          </Link>
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
