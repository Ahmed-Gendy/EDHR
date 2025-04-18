"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/hooks/use-toast"
import { createRecord } from "@/lib/database"

const formSchema = z.object({
  workerId: z.string(),
  evaluationDate: z.string(),
  evaluationType: z.string(),
  qualityRating: z.string(),
  productivityRating: z.string(),
  reliabilityRating: z.string(),
  safetyRating: z.string(),
  teamworkRating: z.string(),
  strengths: z.string().optional(),
  weaknesses: z.string().optional(),
  improvementPlan: z.string().optional(),
  evaluatorNotes: z.string().optional(),
})

interface PerformanceEvaluationFormProps {
  workerId: string
  workerName: string
}

export function PerformanceEvaluationForm({ workerId, workerName }: PerformanceEvaluationFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      workerId,
      evaluationDate: new Date().toISOString().split("T")[0],
      evaluationType: "MONTHLY",
      qualityRating: "3",
      productivityRating: "3",
      reliabilityRating: "3",
      safetyRating: "3",
      teamworkRating: "3",
      strengths: "",
      weaknesses: "",
      improvementPlan: "",
      evaluatorNotes: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)

    try {
      // Calculate overall rating
      const ratings = [
        Number.parseInt(values.qualityRating),
        Number.parseInt(values.productivityRating),
        Number.parseInt(values.reliabilityRating),
        Number.parseInt(values.safetyRating),
        Number.parseInt(values.teamworkRating),
      ]

      const overallRating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length

      // Create performance evaluation record
      const result = await createRecord("performanceEvaluations", {
        workerId: values.workerId,
        evaluationDate: values.evaluationDate,
        evaluationType: values.evaluationType,
        qualityRating: Number.parseInt(values.qualityRating),
        productivityRating: Number.parseInt(values.productivityRating),
        reliabilityRating: Number.parseInt(values.reliabilityRating),
        safetyRating: Number.parseInt(values.safetyRating),
        teamworkRating: Number.parseInt(values.teamworkRating),
        overallRating,
        strengths: values.strengths || null,
        weaknesses: values.weaknesses || null,
        improvementPlan: values.improvementPlan || null,
        evaluatorNotes: values.evaluatorNotes || null,
      })

      if (!result.success) {
        throw new Error("Failed to create performance evaluation")
      }

      toast({
        title: "Evaluation Submitted",
        description: "The performance evaluation has been submitted successfully.",
      })

      router.push(`/daily-workers/${workerId}/performance`)
      router.refresh()
    } catch (error) {
      console.error("Error submitting evaluation:", error)
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
        <div className="bg-blue-50 p-4 rounded-md mb-6">
          <h2 className="font-semibold text-lg">Worker Information</h2>
          <p>Name: {workerName}</p>
          <p>ID: {workerId}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="evaluationDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Evaluation Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="evaluationType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Evaluation Type</FormLabel>
                <FormControl>
                  <select className="w-full p-2 border border-gray-300 rounded-md" {...field}>
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="ANNUAL">Annual</option>
                    <option value="PROJECT">Project-based</option>
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Performance Ratings</h3>
          <p className="text-sm text-gray-500">Rate the worker on a scale of 1 to 5 (1 = Poor, 5 = Excellent)</p>

          <FormField
            control={form.control}
            name="qualityRating"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quality of Work</FormLabel>
                <FormControl>
                  <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <FormItem key={rating} className="flex items-center space-x-1">
                        <FormControl>
                          <RadioGroupItem value={rating.toString()} />
                        </FormControl>
                        <FormLabel className="font-normal">{rating}</FormLabel>
                      </FormItem>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="productivityRating"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Productivity</FormLabel>
                <FormControl>
                  <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <FormItem key={rating} className="flex items-center space-x-1">
                        <FormControl>
                          <RadioGroupItem value={rating.toString()} />
                        </FormControl>
                        <FormLabel className="font-normal">{rating}</FormLabel>
                      </FormItem>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="reliabilityRating"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reliability & Attendance</FormLabel>
                <FormControl>
                  <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <FormItem key={rating} className="flex items-center space-x-1">
                        <FormControl>
                          <RadioGroupItem value={rating.toString()} />
                        </FormControl>
                        <FormLabel className="font-normal">{rating}</FormLabel>
                      </FormItem>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="safetyRating"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Safety Compliance</FormLabel>
                <FormControl>
                  <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <FormItem key={rating} className="flex items-center space-x-1">
                        <FormControl>
                          <RadioGroupItem value={rating.toString()} />
                        </FormControl>
                        <FormLabel className="font-normal">{rating}</FormLabel>
                      </FormItem>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="teamworkRating"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teamwork & Communication</FormLabel>
                <FormControl>
                  <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <FormItem key={rating} className="flex items-center space-x-1">
                        <FormControl>
                          <RadioGroupItem value={rating.toString()} />
                        </FormControl>
                        <FormLabel className="font-normal">{rating}</FormLabel>
                      </FormItem>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="strengths"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Strengths</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="List the worker's key strengths and positive contributions"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="weaknesses"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Areas for Improvement</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="List areas where the worker needs improvement"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="improvementPlan"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Improvement Plan</FormLabel>
              <FormControl>
                <Textarea placeholder="Outline specific steps for improvement" className="min-h-[100px]" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="evaluatorNotes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Notes</FormLabel>
              <FormControl>
                <Textarea placeholder="Any additional comments or observations" className="min-h-[100px]" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.push(`/daily-workers/${workerId}/performance`)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Submitting..." : "Submit Evaluation"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
