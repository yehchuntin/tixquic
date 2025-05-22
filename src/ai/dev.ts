import { config } from 'dotenv';
config();

import '@/ai/flows/predict-optimal-seat.ts';
import '@/ai/flows/generate-success-rate-report.ts';
import '@/ai/flows/solve-captcha.ts';