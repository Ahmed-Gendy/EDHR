"use client"
import { UserForm } from "@/components/user-form"

// Mock data for departments and positions
const departments = [
  { id: "engineering", name: "Engineering" },
  { id: "hr", name: "Human Resources" },
  { id: "finance", name: "Finance" },
  { id: "marketing", name: "Marketing" },
  { id: "operations", name: "Operations" },
]

const positions = [
  { id: "software-engineer", title: "Software Engineer", departmentId: "engineering" },
  { id: "senior-engineer", title: "Senior Engineer", departmentId: "engineering" },
  { id: "tech-lead", title: "Tech Lead", departmentId: "engineering" },
  { id: "hr-specialist", title: "HR Specialist", departmentId: "hr" },
  { id: "hr-manager", title: "HR Manager", departmentId: "hr" },
  { id: "accountant", title: "Accountant", departmentId: "finance" },
  { id: "financial-analyst", title: "Financial Analyst", departmentId: "finance" },
  { id: "marketing-specialist", title: "Marketing Specialist", departmentId: "marketing" },
  { id: "marketing-manager", title: "Marketing Manager", departmentId: "marketing" },
  { id: "operations-manager", title: "Operations Manager", departmentId: "operations" },
  { id: "project-manager", title: "Project Manager", departmentId: "operations" },
]

export default function NewUserPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Create New User</h1>
      <UserForm departments={departments} positions={positions} />
    </div>
  )
}
