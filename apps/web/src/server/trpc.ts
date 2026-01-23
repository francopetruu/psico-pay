import { TRPCError, initTRPC } from "@trpc/server";
import { getDb } from "@/lib/db";
import { auth } from "@/lib/auth";
import superjson from "superjson";

export const createTRPCContext = async () => {
  const session = await auth();
  const db = getDb();

  return {
    session,
    db,
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

// Middleware that enforces user is authenticated
const enforceUserIsAuthed = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    });
  }

  return next({
    ctx: {
      session: ctx.session,
      user: ctx.session.user,
    },
  });
});

// Middleware that enforces user has a therapist profile
const enforceHasTherapist = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    });
  }

  const therapistId = ctx.session.user.therapistId;

  if (!therapistId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You must complete your therapist profile to access this resource",
    });
  }

  return next({
    ctx: {
      session: ctx.session,
      user: ctx.session.user,
      therapistId,
    },
  });
});

// Procedure that requires authentication
export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);

// Procedure that requires authentication AND a therapist profile
// Use this for all tenant-scoped operations
export const therapistProcedure = t.procedure.use(enforceHasTherapist);
