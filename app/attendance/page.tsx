import { requireAuth } from "@/lib/auth"
import { DashboardShell } from "@/components/ui/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Plus, FileSpreadsheet } from "lucide-react"
import Link from "next/link"
import { collection, getDocs, query, where } from "firebase/firestore"
import { firestore } from "@/lib/firebase"
import { format } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

async function getTodayAttendance() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString().split("T")[0]

  // Get today's attendance records - removed the orderBy to avoid needing a composite index
  const attendanceQuery = query(collection(firestore, "dailyAttendance"), where("date", "==", todayStr))
  const attendanceSnapshot = await getDocs(attendanceQuery)

  // Get all daily workers
  const workersSnapshot = await getDocs(collection(firestore, "dailyWorkers"))
  const workers = workersSnapshot.docs.reduce(
    (acc, doc) => {
      const data = doc.data()
      acc[doc.id] = {
        name: `${data.firstName} ${data.lastName}`,
        skillType: data.skillType,
      }
      return acc
    },
    {} as Record<string, { name: string; skillType: string }>,
  )

  // Get all construction sites
  const sitesSnapshot = await getDocs(collection(firestore, "constructionSites"))
  const sites = sitesSnapshot.docs.reduce(
    (acc, doc) => {
      const data = doc.data()
      acc[doc.id] = {
        name: data.name,
        location: data.location,
      }
      return acc
    },
    {} as Record<string, { name: string; location: string }>,
  )

  // Map attendance records
  const attendance = attendanceSnapshot.docs.map((doc) => {
    const data = doc.data()
    const worker = workers[data.workerId] || { name: "Unknown Worker", skillType: "Unknown" }
    const site = sites[data.siteId] || { name: "Unknown Site", location: "Unknown" }

    return {
      id: doc.id,
      workerId: data.workerId,
      workerName: worker.name,
      skillType: worker.skillType,
      siteId: data.siteId,
      siteName: site.name,
      siteLocation: site.location,
      date: data.date,
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      hoursWorked: data.hoursWorked,
      status: data.status,
      notes: data.notes,
    }
  })

  // Sort the records manually after fetching them
  // This replaces the orderBy in the query
  attendance.sort((a, b) => {
    // Sort by most recent first (if we have timestamps)
    if (a.checkIn && b.checkIn) {
      return b.checkIn - a.checkIn
    }
    return 0
  })

  // Get stats
  const stats = {
    total: attendance.length,
    present: attendance.filter((a) => a.status === "PRESENT").length,
    absent: attendance.filter((a) => a.status === "ABSENT").length,
    late: attendance.filter((a) => a.status === "LATE").length,
    halfDay: attendance.filter((a) => a.status === "HALF_DAY").length,
  }

  return { attendance, stats, date: todayStr }
}

export default async function AttendancePage() {
  await requireAuth()
  const { attendance, stats, date } = await getTodayAttendance()

  const getStatusBadge = (status: string) => {
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
    <DashboardShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Daily Attendance</h1>
        <div className="flex gap-2">
          <Link href="/attendance/import">
            <Button variant="outline">
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Import from Excel
            </Button>
          </Link>
          <Link href="/attendance/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Record Attendance
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Today's Attendance - {format(new Date(date), "EEEE, MMMM d, yyyy")}</CardTitle>
            <CardDescription>Summary of daily worker attendance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-muted p-3 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg text-center">
                <p className="text-sm text-green-600">Present</p>
                <p className="text-2xl font-bold text-green-600">{stats.present}</p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg text-center">
                <p className="text-sm text-red-600">Absent</p>
                <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg text-center">
                <p className="text-sm text-yellow-600">Late</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.late}</p>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg text-center">
                <p className="text-sm text-orange-600">Half Day</p>
                <p className="text-2xl font-bold text-orange-600">{stats.halfDay}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Worker</TableHead>
              <TableHead>Site</TableHead>
              <TableHead>Check In</TableHead>
              <TableHead>Check Out</TableHead>
              <TableHead>Hours</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attendance.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No attendance records for today
                </TableCell>
              </TableRow>
            ) : (
              attendance.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{record.workerName}</p>
                      <p className="text-sm text-muted-foreground">{record.skillType}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p>{record.siteName}</p>
                      <p className="text-sm text-muted-foreground">{record.siteLocation}</p>
                    </div>
                  </TableCell>
                  <TableCell>{record.checkIn || "-"}</TableCell>
                  <TableCell>{record.checkOut || "-"}</TableCell>
                  <TableCell>{record.hoursWorked ? `${record.hoursWorked} hrs` : "-"}</TableCell>
                  <TableCell>{getStatusBadge(record.status)}</TableCell>
                  <TableCell>
                    <p className="truncate max-w-[200px]" title={record.notes || ""}>
                      {record.notes || "-"}
                    </p>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </DashboardShell>
  )
}
