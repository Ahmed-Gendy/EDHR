import { requireAuth } from "@/lib/auth"
import { DashboardShell } from "@/components/ui/dashboard-shell"
import { DailyAttendanceForm } from "@/components/daily-attendance-form"
import { collection, getDocs, query, where } from "firebase/firestore"
import { firestore } from "@/lib/firebase"

async function getWorkersAndSites() {
  // Get active daily workers
  const workersQuery = query(collection(firestore, "dailyWorkers"), where("status", "==", "ACTIVE"))
  const workersSnapshot = await getDocs(workersQuery)

  const workers = workersSnapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      firstName: data.firstName || "",
      lastName: data.lastName || "",
      skillType: data.skillType || "",
    }
  })

  // Get active construction sites
  const sitesQuery = query(
    collection(firestore, "constructionSites"),
    where("status", "in", ["PLANNING", "IN_PROGRESS"]),
  )
  const sitesSnapshot = await getDocs(sitesQuery)

  const sites = sitesSnapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      name: data.name || "",
      location: data.location || "",
    }
  })

  return { workers, sites }
}

export default async function NewAttendancePage() {
  await requireAuth()
  const { workers, sites } = await getWorkersAndSites()

  return (
    <DashboardShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Record Daily Attendance</h1>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <DailyAttendanceForm workers={workers} sites={sites} />
      </div>
    </DashboardShell>
  )
}
