
"use client";

import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { generateSuccessRateComparisonReport, type SuccessRateComparisonReportInput, type SuccessRateComparisonReportOutput } from "@/ai/flows/generate-success-rate-report";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { BarChart3, AlertCircle, FileText, LineChart } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";
import type { ChartConfig } from "@/components/ui/chart";

const reportSchema = z.object({
  eventDetails: z.string().min(5, "Event details are required."),
  botUsersCount: z.coerce.number().int().positive("Bot users count must be a positive integer."),
  manualUsersCount: z.coerce.number().int().positive("Manual users count must be a positive integer."),
  botSuccessRate: z.coerce.number().min(0).max(100, "Bot success rate must be between 0 and 100."),
  manualSuccessRate: z.coerce.number().min(0).max(100, "Manual success rate must be between 0 and 100."),
});

type ReportFormValues = z.infer<typeof reportSchema>;

export function SuccessReportForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportResult, setReportResult] = useState<SuccessRateComparisonReportOutput | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
  });

  const chartConfig = {
    botSuccess: {
      label: "Bot Success Rate",
      color: "hsl(var(--chart-1))",
    },
    manualSuccess: {
      label: "Manual Success Rate",
      color: "hsl(var(--chart-2))",
    },
  } satisfies ChartConfig;


  const onSubmit: SubmitHandler<ReportFormValues> = async (data) => {
    setIsLoading(true);
    setError(null);
    setReportResult(null);
    setChartData([]);

    try {
      const input: SuccessRateComparisonReportInput = data;
      const result = await generateSuccessRateComparisonReport(input);
      setReportResult(result);

      setChartData([
        { type: "Bot Users", rate: data.botSuccessRate, fill: "var(--color-botSuccess)" },
        { type: "Manual Users", rate: data.manualSuccessRate, fill: "var(--color-manualSuccess)" },
      ]);

      toast({
        title: "Report Generated!",
        description: "Success rate comparison report is ready.",
      });
      // reset(); // Optionally reset
    } catch (err: any) {
      console.error("Report generation failed:", err);
      const errorMessage = err.message || "An unknown error occurred while generating the report.";
      setError(errorMessage);
      toast({
        title: "Error Generating Report",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      <Card className="w-full shadow-xl">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            <CardTitle className="text-2xl">Success Rate Comparison</CardTitle>
          </div>
          <CardDescription>
            Enter event and user data to generate a comparative success rate report.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="eventDetails">Event Details</Label>
              <Textarea id="eventDetails" placeholder="e.g., Taylor Swift Eras Tour, NYC, 2024-12-25" {...register("eventDetails")} disabled={isLoading} />
              {errors.eventDetails && <p className="text-sm text-destructive">{errors.eventDetails.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="botUsersCount">Bot Users Count</Label>
                <Input id="botUsersCount" type="number" {...register("botUsersCount")} disabled={isLoading} />
                {errors.botUsersCount && <p className="text-sm text-destructive">{errors.botUsersCount.message}</p>}
              </div>
              <div>
                <Label htmlFor="manualUsersCount">Manual Users Count</Label>
                <Input id="manualUsersCount" type="number" {...register("manualUsersCount")} disabled={isLoading} />
                {errors.manualUsersCount && <p className="text-sm text-destructive">{errors.manualUsersCount.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="botSuccessRate">Bot Success Rate (%)</Label>
                <Input id="botSuccessRate" type="number" step="0.1" {...register("botSuccessRate")} disabled={isLoading} />
                {errors.botSuccessRate && <p className="text-sm text-destructive">{errors.botSuccessRate.message}</p>}
              </div>
              <div>
                <Label htmlFor="manualSuccessRate">Manual Success Rate (%)</Label>
                <Input id="manualSuccessRate" type="number" step="0.1" {...register("manualSuccessRate")} disabled={isLoading} />
                {errors.manualSuccessRate && <p className="text-sm text-destructive">{errors.manualSuccessRate.message}</p>}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <LoadingSpinner className="mr-2" /> : <BarChart3 className="mr-2 h-4 w-4" />}
              {isLoading ? "Generating..." : "Generate Report"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card className="w-full shadow-xl lg:sticky lg:top-24">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-8 w-8 text-primary" />
            <CardTitle className="text-2xl">Generated Report & Chart</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 min-h-[300px]">
          {isLoading && !reportResult && (
            <div className="flex flex-col items-center justify-center h-full">
              <LoadingSpinner size={48} />
              <p className="mt-4 text-muted-foreground">Generating report insights...</p>
            </div>
          )}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {!isLoading && !error && !reportResult && (
             <div className="flex flex-col items-center justify-center h-full text-center">
                <LineChart className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">Your report and chart will appear here once generated.</p>
            </div>
          )}
          {reportResult && !error && (
            <>
              <div className="prose dark:prose-invert max-w-none max-h-60 overflow-y-auto rounded-md border p-4 bg-background">
                <h3 className="text-lg font-semibold mb-2 text-primary">Report Summary</h3>
                {reportResult.report.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-2 last:mb-0">{paragraph}</p>
                ))}
              </div>
              {chartData.length > 0 && (
                <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart accessibilityLayer data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="type" tickLine={false} tickMargin={10} axisLine={false} />
                      <YAxis unit="%" tickLine={false} axisLine={false} domain={[0, 100]} />
                      <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                      <Bar dataKey="rate" radius={8} />
                       <ChartLegend content={<ChartLegendContent />} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
