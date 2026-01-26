import { router } from "../trpc";
import { sessionsRouter } from "./sessions";
import { patientsRouter } from "./patients";
import { paymentsRouter } from "./payments";
import { reportsRouter } from "./reports";
import { profileRouter } from "./profile";
import { pricingRouter } from "./pricing";

export const appRouter = router({
  sessions: sessionsRouter,
  patients: patientsRouter,
  payments: paymentsRouter,
  reports: reportsRouter,
  profile: profileRouter,
  pricing: pricingRouter,
});

export type AppRouter = typeof appRouter;
