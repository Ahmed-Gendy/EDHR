"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

const formSchema = z.object({
  first_name: z.string().min(2, { message: "First name must be at least 2 characters" }),
  last_name: z.string().min(2, { message: "Last name must be at least 2 characters" }),
  phone: z.string().min(5, { message: "Phone number must be at least 5 characters" }),
  specialization: z.string().min(2, { message: "Specialization must be at least 2 characters" }),
  daily_rate: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Daily rate must be a positive number",
  }),
  status: z.string(),
  hire_date: z.string(),
  bank_name: z.string().optional(),
  account_number: z.string().optional(),
  notes: z.string().optional(),
})

interface DailyWorkerFormProps {
  worker?: {
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
  isEditing?: boolean
}

export function DailyWorkerForm({ worker, isEditing = false }: DailyWorkerFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: worker?.first_name || "",
      last_name: worker?.last_name || "",
      phone: worker?.phone || "",
      specialization: worker?.specialization || "",
      daily_rate: worker?.daily_rate?.toString() || "",
      status: worker?.status || "ACTIVE",
      hire_date: worker?.hire_date || new Date().toISOString().split("T")[0],
      bank_name: worker?.bank_name || "",
      account_number: worker?.account_number || "",
      notes: worker?.notes || "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)

    try {
      if (isEditing && worker) {
        // Update existing worker
        const response = await fetch(`/api/daily-workers/${worker.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
        })

        if (!response.ok) {
          throw new Error("Failed to update worker")
        }

        toast({
          title: "Worker Updated",
          description: "The worker has been updated successfully.",
        })
      } else {
        // Create new worker
        const response = await fetch("/api/daily-workers", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
        })

        if (!response.ok) {
          throw new Error("Failed to create worker")
        }

        toast({
          title: "Worker Created",
          description: "The worker has been created successfully.",
        })
      }

      router.push("/daily-workers")
      router.refresh()
    } catch (error) {
      console.error("Error submitting form:", error)
      toast({
        title: "Error",
        description: "An error occurred. Please try again.",
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
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="John" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="+1 (555) 123-4567" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="specialization"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Specialization</FormLabel>
                <FormControl>
                  <Input placeholder="Carpenter" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="daily_rate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Daily Rate</FormLabel>
                <FormControl>
                  <Input type="number" min="0" step="0.01" placeholder="100.00" {...field} />
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
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="ON_LEAVE">On Leave</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="hire_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hire Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="bank_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bank Name (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Bank Name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="account_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account Number (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Account Number" {...field} />
                </FormControl>
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
                <Textarea placeholder="Additional notes about the worker" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.push("/daily-workers")}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (isEditing ? "Updating..." : "Creating...") : isEditing ? "Update Worker" : "Create Worker"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
