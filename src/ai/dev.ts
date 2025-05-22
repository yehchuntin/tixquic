
import { config } from 'dotenv';
config();

import '@/ai/flows/predict-optimal-seat.ts';
// import '@/ai/flows/generate-success-rate-report.ts'; // Removed as user-facing report is removed
// solve-captcha flow can also be removed if the page/feature is not present
// import '@/ai/flows/solve-captcha.ts'; 
