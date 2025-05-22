
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
import { predictOptimalSeatingLocation, type PredictOptimalSeatingLocationInput, type PredictOptimalSeatingLocationOutput } from "@/ai/flows/predict-optimal-seat";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { Lightbulb, AlertCircle, Sparkles, Percent } from "lucide-react";

const seatPredictionSchema = z.object({
  seatingChartData: z.string().min(10, "Seating chart data is required (min 10 characters)."),
  historicalSuccessRates: z.string().min(10, "Historical success rates are required (min 10 characters)."),
  desiredLocation: z.string().min(3, "Desired location is required (min 3 characters)."),
});

type SeatPredictionFormValues = z.infer<typeof seatPredictionSchema>;

export function SeatPredictorForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [predictionResult, setPredictionResult] = useState<PredictOptimalSeatingLocationOutput['optimalSeatingPrediction'] | null>(null);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SeatPredictionFormValues>({
    resolver: zodResolver(seatPredictionSchema),
  });

  const onSubmit: SubmitHandler<SeatPredictionFormValues> = async (data) => {
    setIsLoading(true);
    setError(null);
    setPredictionResult(null);

    try {
      const input: PredictOptimalSeatingLocationInput = {
        seatingChartData: data.seatingChartData,
        historicalSuccessRates: data.historicalSuccessRates,
        desiredLocation: data.desiredLocation,
      };

      const result: PredictOptimalSeatingLocationOutput = await predictOptimalSeatingLocation(input);
      setPredictionResult(result.optimalSeatingPrediction);
      toast({
        title: "Seat Prediction Complete!",
        description: "Optimal seats and success probability calculated.",
      });
      // reset(); // Optionally reset the form
    } catch (err: any) {
      console.error("Seat prediction failed:", err);
      const errorMessage = err.message || "An unknown error occurred during seat prediction.";
      setError(errorMessage);
      toast({
        title: "Error Predicting Seats",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb className="h-8 w-8 text-primary" />
          <CardTitle className="text-2xl">AI Seat Predictor</CardTitle>
        </div>
        <CardDescription>
          Provide seating chart data, historical success rates, and your desired location to get optimal seat predictions.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="seatingChartData">Seating Chart Data</Label>
            <Textarea
              id="seatingChartData"
              placeholder="Enter seating chart details (e.g., sections, rows, seat numbers)"
              {...register("seatingChartData")}
              rows={5}
              disabled={isLoading}
              className="resize-y"
            />
            {errors.seatingChartData && (
              <p className="text-sm text-destructive">{errors.seatingChartData.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="historicalSuccessRates">Historical Success Rates</Label>
            <Textarea
              id="historicalSuccessRates"
              placeholder="Enter historical data (e.g., 'Section A1: 80% success, Section B2: 65% success')"
              {...register("historicalSuccessRates")}
              rows={5}
              disabled={isLoading}
              className="resize-y"
            />
            {errors.historicalSuccessRates && (
              <p className="text-sm text-destructive">{errors.historicalSuccessRates.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="desiredLocation">Desired Location</Label>
            <Input
              id="desiredLocation"
              placeholder="e.g., 'Section C, Row 5' or 'Anywhere front-center'"
              {...register("desiredLocation")}
              disabled={isLoading}
            />
            {errors.desiredLocation && (
              <p className="text-sm text-destructive">{errors.desiredLocation.message}</p>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {predictionResult && !error && (
            <Card className="bg-accent/10 border-accent">
              <CardHeader>
                <CardTitle className="text-accent flex items-center"><Sparkles className="mr-2 h-5 w-5"/>Prediction Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-sm font-semibold">Predicted Optimal Seats:</Label>
                  <p className="text-lg p-2 bg-background rounded-md shadow-sm">{predictionResult.predictedOptimalSeats}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Success Probability for Desired Location:</Label>
                  <div className="flex items-center gap-2 p-2 bg-background rounded-md shadow-sm">
                    <Percent className="h-5 w-5 text-primary"/>
                    <p className="text-lg">{(predictionResult.successProbability * 100).toFixed(1)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? <LoadingSpinner className="mr-2" /> : <Lightbulb className="mr-2 h-4 w-4" />}
            {isLoading ? "Predicting..." : "Predict Optimal Seats"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
