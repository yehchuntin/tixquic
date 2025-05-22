
"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { solveCaptcha, type SolveCaptchaInput, type SolveCaptchaOutput } from "@/ai/flows/solve-captcha";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { ScanText, AlertCircle, CheckCircle2 } from "lucide-react";

const captchaSchema = z.object({
  captchaFile: z.any().refine((files) => files?.length > 0, "CAPTCHA image is required."),
  openAiApiKey: z.string().min(1, "OpenAI API Key is required."),
});

type CaptchaFormValues = z.infer<typeof captchaSchema>;

const fileToDataUri = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export function CaptchaSolverForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [solution, setSolution] = useState<string | null>(null);
  const [captchaPreview, setCaptchaPreview] = useState<string | null>(null);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<CaptchaFormValues>({
    resolver: zodResolver(captchaSchema),
  });

  const watchedFile = watch("captchaFile");

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setValue("captchaFile", event.target.files);
      try {
        const dataUri = await fileToDataUri(file);
        setCaptchaPreview(dataUri);
      } catch (err) {
        setError("Failed to read image file.");
        setCaptchaPreview(null);
      }
    } else {
      setValue("captchaFile", null);
      setCaptchaPreview(null);
    }
  };

  const onSubmit: SubmitHandler<CaptchaFormValues> = async (data) => {
    setIsLoading(true);
    setError(null);
    setSolution(null);

    try {
      const file = data.captchaFile[0];
      if (!file) {
        setError("No file selected.");
        setIsLoading(false);
        return;
      }
      const captchaDataUri = await fileToDataUri(file);

      const input: SolveCaptchaInput = {
        captchaDataUri,
        openAiApiKey: data.openAiApiKey,
      };

      const result: SolveCaptchaOutput = await solveCaptcha(input);
      setSolution(result.solution);
      toast({
        title: "CAPTCHA Solved!",
        description: `Solution: ${result.solution}`,
        variant: "default",
      });
      reset({openAiApiKey: data.openAiApiKey}); // Reset form but keep API key
      setCaptchaPreview(null);

    } catch (err: any) {
      console.error("CAPTCHA solving failed:", err);
      const errorMessage = err.message || "An unknown error occurred while solving the CAPTCHA.";
      setError(errorMessage);
      toast({
        title: "Error Solving CAPTCHA",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto shadow-xl">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <ScanText className="h-8 w-8 text-primary" />
          <CardTitle className="text-2xl">CAPTCHA Solver</CardTitle>
        </div>
        <CardDescription>
          Upload a CAPTCHA image and provide your OpenAI API Key to get the solution.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="captchaFile">CAPTCHA Image</Label>
            <Input
              id="captchaFile"
              type="file"
              accept="image/*"
              {...register("captchaFile")}
              onChange={handleFileChange}
              className="file:text-primary file:font-semibold"
              disabled={isLoading}
            />
            {errors.captchaFile && (
              <p className="text-sm text-destructive">{errors.captchaFile.message as string}</p>
            )}
            {captchaPreview && (
              <div className="mt-4 border rounded-md p-2 flex justify-center">
                <Image src={captchaPreview} alt="CAPTCHA Preview" width={200} height={70} className="rounded" />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="openAiApiKey">OpenAI API Key</Label>
            <Input
              id="openAiApiKey"
              type="password"
              placeholder="Enter your OpenAI API Key"
              {...register("openAiApiKey")}
              disabled={isLoading}
            />
            {errors.openAiApiKey && (
              <p className="text-sm text-destructive">{errors.openAiApiKey.message}</p>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {solution && !error && (
            <Alert variant="default" className="bg-green-50 border-green-300">
               <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-700">Solution Found</AlertTitle>
              <AlertDescription className="text-lg font-semibold text-green-600">{solution}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? <LoadingSpinner className="mr-2" /> : <ScanText className="mr-2 h-4 w-4" />}
            {isLoading ? "Solving..." : "Solve CAPTCHA"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
