'use server';

/**
 * @fileOverview Generates a detailed report comparing the ticket-snatching success rates between bot users and manual purchasers.
 *
 * - generateSuccessRateComparisonReport - A function that generates the success rate comparison report.
 * - SuccessRateComparisonReportInput - The input type for the generateSuccessRateComparisonReport function.
 * - SuccessRateComparisonReportOutput - The return type for the generateSuccessRateComparisonReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuccessRateComparisonReportInputSchema = z.object({
  eventDetails: z
    .string()
    .describe('Details about the event, including name, date, and venue.'),
  botUsersCount: z.number().describe('The number of users using the ticket-snatching bot.'),
  manualUsersCount: z.number().describe('The number of users attempting to purchase tickets manually.'),
  botSuccessRate: z
    .number()
    .describe('The success rate of the bot users (percentage between 0 and 100).'),
  manualSuccessRate: z
    .number()
    .describe('The success rate of the manual users (percentage between 0 and 100).'),
});
export type SuccessRateComparisonReportInput = z.infer<typeof SuccessRateComparisonReportInputSchema>;

const SuccessRateComparisonReportOutputSchema = z.object({
  report: z
    .string()
    .describe(
      'A detailed report comparing the ticket-snatching success rates between bot users and manual purchasers.'
    ),
});
export type SuccessRateComparisonReportOutput = z.infer<typeof SuccessRateComparisonReportOutputSchema>;

export async function generateSuccessRateComparisonReport(
  input: SuccessRateComparisonReportInput
): Promise<SuccessRateComparisonReportOutput> {
  return generateSuccessRateComparisonReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'successRateComparisonReportPrompt',
  input: {schema: SuccessRateComparisonReportInputSchema},
  output: {schema: SuccessRateComparisonReportOutputSchema},
  prompt: `You are an expert data analyst specializing in creating reports on ticket purchasing success rates.

You will use the provided data to generate a detailed report comparing the success rates between users of a ticket-snatching bot and those attempting to purchase tickets manually.

Event Details: {{{eventDetails}}}
Number of Bot Users: {{{botUsersCount}}}
Number of Manual Users: {{{manualUsersCount}}}
Bot Success Rate: {{{botSuccessRate}}}%
Manual Success Rate: {{{manualSuccessRate}}}%

Generate a report that includes:
- A clear comparison of the success rates, highlighting the difference between the two groups.
- Potential reasons for the observed difference in success rates.
- A conclusion summarizing the efficiency of the bot compared to manual purchasing.
`,
});

const generateSuccessRateComparisonReportFlow = ai.defineFlow(
  {
    name: 'generateSuccessRateComparisonReportFlow',
    inputSchema: SuccessRateComparisonReportInputSchema,
    outputSchema: SuccessRateComparisonReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
