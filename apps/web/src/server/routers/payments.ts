import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { sessions, patients, paymentPreferences } from "@psico-pay/db/schema";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";

export const paymentsRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        status: z.enum(["pending", "paid", "failed", "refunded"]).optional(),
        from: z.date().optional(),
        to: z.date().optional(),
      }).default({})
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];

      if (input.status) {
        conditions.push(eq(sessions.paymentStatus, input.status));
      }
      if (input.from) {
        conditions.push(gte(sessions.scheduledAt, input.from));
      }
      if (input.to) {
        conditions.push(lte(sessions.scheduledAt, input.to));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const [paymentList, countResult] = await Promise.all([
        ctx.db
          .select({
            id: sessions.id,
            scheduledAt: sessions.scheduledAt,
            amount: sessions.amount,
            paymentStatus: sessions.paymentStatus,
            paymentId: sessions.paymentId,
            createdAt: sessions.createdAt,
            patient: {
              id: patients.id,
              name: patients.name,
              phone: patients.phone,
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
        payments: paymentList,
        total: Number(countResult[0]?.count ?? 0),
      };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const payment = await ctx.db
        .select({
          id: sessions.id,
          scheduledAt: sessions.scheduledAt,
          amount: sessions.amount,
          paymentStatus: sessions.paymentStatus,
          paymentId: sessions.paymentId,
          status: sessions.status,
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
        .where(eq(sessions.id, input.id))
        .limit(1);

      if (payment.length === 0) {
        return null;
      }

      // Get payment preference if exists
      const preference = await ctx.db
        .select()
        .from(paymentPreferences)
        .where(eq(paymentPreferences.sessionId, input.id))
        .limit(1);

      return {
        ...payment[0],
        paymentPreference: preference[0] ?? null,
      };
    }),

  stats: protectedProcedure
    .input(
      z.object({
        from: z.date().optional(),
        to: z.date().optional(),
      }).default({})
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];

      if (input.from) {
        conditions.push(gte(sessions.scheduledAt, input.from));
      }
      if (input.to) {
        conditions.push(lte(sessions.scheduledAt, input.to));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Total paid
      const paidResult = await ctx.db
        .select({
          total: sql<string>`COALESCE(SUM(${sessions.amount}), 0)`,
          count: sql<number>`COUNT(*)`,
        })
        .from(sessions)
        .where(
          whereClause
            ? and(whereClause, eq(sessions.paymentStatus, "paid"))
            : eq(sessions.paymentStatus, "paid")
        );

      // Total pending
      const pendingResult = await ctx.db
        .select({
          total: sql<string>`COALESCE(SUM(${sessions.amount}), 0)`,
          count: sql<number>`COUNT(*)`,
        })
        .from(sessions)
        .where(
          whereClause
            ? and(whereClause, eq(sessions.paymentStatus, "pending"))
            : eq(sessions.paymentStatus, "pending")
        );

      // Total sessions
      const totalResult = await ctx.db
        .select({
          count: sql<number>`COUNT(*)`,
        })
        .from(sessions)
        .where(whereClause);

      const totalPaid = Number(paidResult[0]?.total ?? 0);
      const totalPending = Number(pendingResult[0]?.total ?? 0);
      const paidCount = Number(paidResult[0]?.count ?? 0);
      const pendingCount = Number(pendingResult[0]?.count ?? 0);
      const totalCount = Number(totalResult[0]?.count ?? 0);

      const collectionRate = totalCount > 0 ? (paidCount / totalCount) * 100 : 0;

      return {
        totalPaid,
        totalPending,
        paidCount,
        pendingCount,
        totalCount,
        collectionRate: Math.round(collectionRate),
      };
    }),

  registerManual: protectedProcedure
    .input(
      z.object({
        sessionId: z.string().uuid(),
        paymentMethod: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const paymentId = `MANUAL-${Date.now()}${input.paymentMethod ? `-${input.paymentMethod}` : ""}`;

      await ctx.db
        .update(sessions)
        .set({
          paymentStatus: "paid",
          paymentId,
        })
        .where(eq(sessions.id, input.sessionId));

      return { success: true, paymentId };
    }),
});
