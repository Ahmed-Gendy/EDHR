import { requireAuth } from "@/lib/auth"
import { DashboardShell } from "@/components/ui/dashboard-shell"
import { getUser } from "@/lib/user-service"
import { ProfileForm } from "@/components/profile-form"
import { ref, get } from "firebase/database"
import { database } from "@/lib/firebase"

async function getDepartmentsAndPositions() {
  // Get departments
  const departmentsRef = ref(database, "departments")
  const departmentsSnapshot = await get(departmentsRef)

  const departments: { id: string; name: string }[] = []
  if (departmentsSnapshot.exists()) {
    departmentsSnapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val()
      departments.push({
        id: childSnapshot.key as string,
        name: data.name,
      })
    })
  }

  // Get positions
  const positionsRef = ref(database, "positions")
  const positionsSnapshot = await get(positionsRef)

  const positions: { id: string; title: string; departmentId: string }[] = []
  if (positionsSnapshot.exists()) {
    positionsSnapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val()
      positions.push({
        id: childSnapshot.key as string,
        title: data.title,
        departmentId: data.departmentId,
      })
    })
  }

  return { departments, positions }
}

export default async function ProfilePage() {
  const session = await requireAuth()
  const user = await getUser(session.id)
  const { departments, positions } = await getDepartmentsAndPositions()

  if (!user) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Profile</h1>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">User not found</h2>
          <p>Your user profile could not be found. Please contact an administrator.</p>
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">My Profile</h1>
      </div>
      <ProfileForm user={user} departments={departments} positions={positions} />
    </DashboardShell>
  )
}
