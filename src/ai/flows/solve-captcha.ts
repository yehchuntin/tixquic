// 'use server';

/**
 * @fileOverview An AI agent that solves CAPTCHAs using the OpenAI API.
 *
 * - solveCaptcha - A function that handles the CAPTCHA solving process.
 * - SolveCaptchaInput - The input type for the solveCaptcha function.
 * - SolveCaptchaOutput - The return type for the solveCaptcha function.
 */

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SolveCaptchaInputSchema = z.object({
  captchaDataUri: z
    .string()
    .describe(
      "A CAPTCHA image, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  openAiApiKey: z.string().describe('The user provided OpenAI API key.'),
});
export type SolveCaptchaInput = z.infer<typeof SolveCaptchaInputSchema>;

const SolveCaptchaOutputSchema = z.object({
  solution: z.string().describe('The solution to the CAPTCHA.'),
});
export type SolveCaptchaOutput = z.infer<typeof SolveCaptchaOutputSchema>;

export async function solveCaptcha(input: SolveCaptchaInput): Promise<SolveCaptchaOutput> {
  return solveCaptchaFlow(input);
}

const solveCaptchaPrompt = ai.definePrompt({
  name: 'solveCaptchaPrompt',
  input: {schema: SolveCaptchaInputSchema},
  output: {schema: SolveCaptchaOutputSchema},
  prompt: `You are an expert CAPTCHA solver.

You will be provided with a CAPTCHA image. Your task is to analyze the image and provide the correct solution.

Here is the CAPTCHA image:
{{media url=captchaDataUri}}

Output the solution.`, // Removed OpenAI API key from the prompt
  model: 'gemini-pro-vision',
  config: {
    // safetySettings needs to be tuned appropriately for CAPTCHAs
    // Certain CAPTCHAs might be considered sensitive information
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

const solveCaptchaFlow = ai.defineFlow(
  {
    name: 'solveCaptchaFlow',
    inputSchema: SolveCaptchaInputSchema,
    outputSchema: SolveCaptchaOutputSchema,
  },
  async input => {
    const {output} = await solveCaptchaPrompt(input);
    return output!;
  }
);
