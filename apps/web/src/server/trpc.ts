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

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);
