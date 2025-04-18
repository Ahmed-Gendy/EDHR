import { requireAuth } from "@/lib/auth"
import { DashboardShell } from "@/components/ui/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { ConstructionSiteList } from "@/components/construction-site-list"
import { collection, getDocs, query, where } from "firebase/firestore"
import { firestore } from "@/lib/firebase"

async function getConstructionSites() {
  // Get all construction sites
  const sitesQuery = query(collection(firestore, "constructionSites"), where("deleted", "==", false))
  const sitesSnapshot = await getDocs(sitesQuery)

  // Get all employees for mapping manager names
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

  // Map construction sites
  const sites = sitesSnapshot.docs.map((doc) => {
    const data = doc.data()
    const managerName = data.managerId ? employees[data.managerId]?.name : null

    return {
      id: doc.id,
      name: data.name,
      location: data.location,
      client: data.client,
      start_date: data.startDate,
      end_date: data.endDate,
      status: data.status,
      budget: data.budget,
      manager_name: managerName,
      progress: data.progress || 0,
    }
  })

  return sites
}

export default async function ConstructionSitesPage() {
  await requireAuth()
  const sites = await getConstructionSites()

  return (
    <DashboardShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Construction Sites</h1>
        <Link href="/construction-sites/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Construction Site
          </Button>
        </Link>
      </div>
      <ConstructionSiteList sites={sites} />
    </DashboardShell>
  )
}
