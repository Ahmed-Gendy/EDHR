import { DailyWorkerList } from "@/components/daily-worker-list"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Upload, Plus } from "lucide-react"

export default function DailyWorkersPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Daily Workers</h1>
        <div className="flex gap-2">
          <Link href="/daily-workers/import">
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Import Workers
            </Button>
          </Link>
          <Link href="/daily-workers/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Worker
            </Button>
          </Link>
        </div>
      </div>
      <DailyWorkerList />
    </div>
  )
}
