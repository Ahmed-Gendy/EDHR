"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { recordDailyAttendance } from "@/lib/firebase-collections"
import { Input } from "@/components/ui/input"

interface DailyWorker {
  id: string
  firstName: string
  lastName: string
  skillType: string
}

interface ConstructionSite {
  id: string
  name: string
  location: string
}

interface DailyAttendanceFormProps {
  workers: DailyWorker[]
  sites: ConstructionSite[]
  workerId?: string
  siteId?: string
  date?: Date
}

const formSchema = z.object({
  workerId: z.string({ required_error: "Worker is required" }),
  siteId: z.string({ required_error: "Construction site is required" }),
  date: z.date({ required_error: "Date is required" }),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  hoursWorked: z.coerce.number().min(0).max(24).optional(),
  status: z.enum(["PRESENT", "ABSENT", "LATE", "HALF_DAY"]),
  notes: z.string().optional(),
})

export function DailyAttendanceForm({ workers, sites, workerId, siteId, date }: DailyAttendanceFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const [selectedWorkerId, setSelectedWorkerId] = useState(workerId || "")

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      workerId: workerId || "",
      siteId: siteId || "",
      date: date || new Date(),
      checkIn: "",
      checkOut: "",
      hoursWorked: 0, // Change from undefined to 0
      status: "PRESENT",
      notes: "",
    },
  })

  // Update hours worked when check-in and check-out times change
  const watchCheckIn = form.watch("checkIn")
  const watchCheckOut = form.watch("checkOut")

  useEffect(() => {
    if (watchCheckIn && watchCheckOut) {
      const checkInTime = new Date(`1970-01-01T${watchCheckIn}:00`)
      const checkOutTime = new Date(`1970-01-01T${watchCheckOut}:00`)

      // If check-out is earlier than check-in, assume it's the next day
      let diffMs = checkOutTime.getTime() - checkInTime.getTime()
      if (diffMs < 0) {
        diffMs += 24 * 60 * 60 * 1000 // Add 24 hours
      }

      const diffHours = diffMs / (1000 * 60 * 60)
      form.setValue("hoursWorked", Number.parseFloat(diffHours.toFixed(2)))
    }
  }, [watchCheckIn, watchCheckOut, form])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)

    try {
      const attendanceData = {
        workerId: values.workerId,
        siteId: values.siteId,
        date: values.date.toISOString().split("T")[0],
        checkIn: values.checkIn || null,
        checkOut: values.checkOut || null,
        hoursWorked: values.hoursWorked || 0, // Use 0 instead of null
        status: values.status,
        notes: values.notes || null,
      }

      await recordDailyAttendance(attendanceData)

      toast({
        title: "Attendance recorded",
        description: "The attendance record has been saved successfully.",
      })

      // Redirect based on context
      if (workerId) {
        router.push(`/daily-workers/${workerId}/attendance`)
      } else if (siteId) {
        router.push(`/construction-sites/${siteId}/attendance`)
      } else {
        router.push("/attendance")
      }

      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="workerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Worker</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value)
                    setSelectedWorkerId(value)
                  }}
                  defaultValue={field.value}
                  disabled={!!workerId}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select worker" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {workers.map((worker) => (
                      <SelectItem key={worker.id} value={worker.id}>
                        {worker.firstName} {worker.lastName} ({worker.skillType})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="siteId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Construction Site</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!siteId}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select site" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {sites.map((site) => (
                      <SelectItem key={site.id} value={site.id}>
                        {site.name} ({site.location})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                    >
                      {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="checkIn"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Check-in Time</FormLabel>
                <div className="flex items-center">
                  <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="checkOut"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Check-out Time</FormLabel>
                <div className="flex items-center">
                  <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="hoursWorked"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hours Worked</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    {...field}
                    value={field.value || ""} // Ensure value is never undefined
                    onChange={(e) => {
                      const value = e.target.value === "" ? 0 : Number.parseFloat(e.target.value)
                      field.onChange(value)
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="PRESENT">Present</SelectItem>
                    <SelectItem value="ABSENT">Absent</SelectItem>
                    <SelectItem value="LATE">Late</SelectItem>
                    <SelectItem value="HALF_DAY">Half Day</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="Additional notes" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4">
          <Button variant="outline" type="button" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Record Attendance"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
