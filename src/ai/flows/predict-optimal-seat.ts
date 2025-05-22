// This file is machine-generated - edit at your own risk.

'use server';

/**
 * @fileOverview Predicts the optimal seating location for maximizing chances of securing tickets.
 *
 * - predictOptimalSeatingLocation - A function that handles the prediction of optimal seating location.
 * - PredictOptimalSeatingLocationInput - The input type for the predictOptimalSeatingLocation function.
 * - PredictOptimalSeatingLocationOutput - The return type for the predictOptimalSeatingLocation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PredictOptimalSeatingLocationInputSchema = z.object({
  seatingChartData: z
    .string()
    .describe('Seating chart data, including section and seat numbers.'),
  historicalSuccessRates: z
    .string()
    .describe('Historical success rates for different seating locations.'),
  desiredLocation: z
    .string()
    .describe(
      'The desired seating location that will be checked for probability of success.'
    ),
});
export type PredictOptimalSeatingLocationInput = z.infer<
  typeof PredictOptimalSeatingLocationInputSchema
>;

const PredictOptimalSeatingLocationOutputSchema = z.object({
  optimalSeatingPrediction: z.object({
    predictedOptimalSeats: z
      .string()
      .describe('The predicted optimal seats based on the input data.'),
    successProbability: z
      .number()
      .describe(
        'The probability of success for the desired location, from 0 to 1.'
      ),
  }),
});
export type PredictOptimalSeatingLocationOutput = z.infer<
  typeof PredictOptimalSeatingLocationOutputSchema
>;

export async function predictOptimalSeatingLocation(
  input: PredictOptimalSeatingLocationInput
): Promise<PredictOptimalSeatingLocationOutput> {
  return predictOptimalSeatingLocationFlow(input);
}

const getModulePurchases = ai.defineTool({
  name: 'getModulePurchases',
  description: 'Returns the number of users who have purchased a module.',
  inputSchema: z.object({
    moduleName: z.string().describe('The name of the module.'),
  }),
  outputSchema: z.number(),
});

const prompt = ai.definePrompt({
  name: 'predictOptimalSeatingLocationPrompt',
  input: {schema: PredictOptimalSeatingLocationInputSchema},
  output: {schema: PredictOptimalSeatingLocationOutputSchema},
  tools: [getModulePurchases],
  system: `You are an AI expert in predicting optimal seating locations for ticket purchases.

You will be provided with seating chart data and historical success rates for different seating locations.

Use the getModulePurchases tool to determine how many people have purchased a module, and whether the desired location will result in a low probability of success.

Based on this information, predict the optimal seating locations for the user to maximize their chances of securing tickets.

Consider the following:

- Seating chart data: {{{seatingChartData}}}
- Historical success rates: {{{historicalSuccessRates}}}
- Desired location: {{{desiredLocation}}}`,
  prompt: `Predict the optimal seating locations, taking into account the number of users who have purchased the module, which can be determined using the getModulePurchases tool. Also, determine the probability of success for the desired location.

Return a JSON object with the predicted optimal seats and the success probability.`,
});

const predictOptimalSeatingLocationFlow = ai.defineFlow(
  {
    name: 'predictOptimalSeatingLocationFlow',
    inputSchema: PredictOptimalSeatingLocationInputSchema,
    outputSchema: PredictOptimalSeatingLocationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
