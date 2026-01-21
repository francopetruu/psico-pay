import { router } from "../trpc";
import { sessionsRouter } from "./sessions";
import { patientsRouter } from "./patients";
import { paymentsRouter } from "./payments";
import { reportsRouter } from "./reports";

export const appRouter = router({
  sessions: sessionsRouter,
  patients: patientsRouter,
  payments: paymentsRouter,
  reports: reportsRouter,
});

export type AppRouter = typeof appRouter;
