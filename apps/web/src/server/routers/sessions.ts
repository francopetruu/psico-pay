import { z } from "zod";
import { router, therapistProcedure } from "../trpc";
import { sessions, patients, notifications } from "@psico-pay/db/schema";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";

export const sessionsRouter = router({
  list: therapistProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        status: z.enum(["scheduled", "completed", "cancelled", "no_show"]).optional(),
        paymentStatus: z.enum(["pending", "paid", "failed", "refunded"]).optional(),
        patientId: z.string().uuid().optional(),
        from: z.date().optional(),
        to: z.date().optional(),
      }).default({})
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(sessions.therapistId, ctx.therapistId)];

      if (input.status) {
        conditions.push(eq(sessions.status, input.status));
      }
      if (input.paymentStatus) {
        conditions.push(eq(sessions.paymentStatus, input.paymentStatus));
      }
      if (input.patientId) {
        conditions.push(eq(sessions.patientId, input.patientId));
      }
      if (input.from) {
        conditions.push(gte(sessions.scheduledAt, input.from));
      }
      if (input.to) {
        conditions.push(lte(sessions.scheduledAt, input.to));
      }

      const whereClause = and(...conditions);

      const [sessionList, countResult] = await Promise.all([
        ctx.db
          .select({
            id: sessions.id,
            scheduledAt: sessions.scheduledAt,
            durationMinutes: sessions.durationMinutes,
            amount: sessions.amount,
            status: sessions.status,
            paymentStatus: sessions.paymentStatus,
            meetLink: sessions.meetLink,
            createdAt: sessions.createdAt,
            patient: {
              id: patients.id,
              name: patients.name,
              phone: patients.phone,
              email: patients.email,
            },
          })
          .from(sessions)
          .leftJoin(patients, eq(sessions.patientId, patients.id))
          .where(whereClause)
          .orderBy(desc(sessions.scheduledAt))
          .limit(input.limit)
          .offset(input.offset),
        ctx.db
          .select({ count: sql<number>`count(*)` })
          .from(sessions)
          .where(whereClause),
      ]);

      return {
        sessions: sessionList,
        total: Number(countResult[0]?.count ?? 0),
      };
    }),

  getById: therapistProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const session = await ctx.db
        .select({
          id: sessions.id,
          scheduledAt: sessions.scheduledAt,
          durationMinutes: sessions.durationMinutes,
          amount: sessions.amount,
          status: sessions.status,
          paymentStatus: sessions.paymentStatus,
          paymentId: sessions.paymentId,
          meetLink: sessions.meetLink,
          cancellationReason: sessions.cancellationReason,
          cancelledAt: sessions.cancelledAt,
          completedAt: sessions.completedAt,
          reminder24hSent: sessions.reminder24hSent,
          reminder2hSent: sessions.reminder2hSent,
          meetLinkSent: sessions.meetLinkSent,
          createdAt: sessions.createdAt,
          patient: {
            id: patients.id,
            name: patients.name,
            phone: patients.phone,
            email: patients.email,
          },
        })
        .from(sessions)
        .leftJoin(patients, eq(sessions.patientId, patients.id))
        .where(
          and(
            eq(sessions.id, input.id),
            eq(sessions.therapistId, ctx.therapistId)
          )
        )
        .limit(1);

      if (session.length === 0) {
        return null;
      }

      // Get notifications for this session
      const sessionNotifications = await ctx.db
        .select()
        .from(notifications)
        .where(eq(notifications.sessionId, input.id))
        .orderBy(desc(notifications.createdAt));

      return {
        ...session[0],
        notifications: sessionNotifications,
      };
    }),

  markAsPaid: therapistProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(sessions)
        .set({
          paymentStatus: "paid",
          paymentId: `MANUAL-${Date.now()}`,
        })
        .where(
          and(
            eq(sessions.id, input.id),
            eq(sessions.therapistId, ctx.therapistId)
          )
        );

      return { success: true };
    }),

  cancel: therapistProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(sessions)
        .set({
          status: "cancelled",
          cancellationReason: input.reason,
          cancelledAt: new Date(),
        })
        .where(
          and(
            eq(sessions.id, input.id),
            eq(sessions.therapistId, ctx.therapistId)
          )
        );

      return { success: true };
    }),

  markAsCompleted: therapistProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(sessions)
        .set({
          status: "completed",
          completedAt: new Date(),
        })
        .where(
          and(
            eq(sessions.id, input.id),
            eq(sessions.therapistId, ctx.therapistId)
          )
        );

      return { success: true };
    }),
});
