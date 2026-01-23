import { z } from "zod";
import { router, therapistProcedure } from "../trpc";
import { sessions, patients } from "@psico-pay/db/schema";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";

export const reportsRouter = router({
  overview: therapistProcedure
    .input(
      z.object({
        months: z.number().min(1).max(12).default(3),
      }).default({})
    )
    .query(async ({ ctx, input }) => {
      const now = new Date();
      const startDate = startOfMonth(subMonths(now, input.months - 1));
      const endDate = endOfMonth(now);

      const baseConditions = [
        eq(sessions.therapistId, ctx.therapistId),
        gte(sessions.scheduledAt, startDate),
        lte(sessions.scheduledAt, endDate),
      ];

      // Total revenue for the period
      const revenueResult = await ctx.db
        .select({
          total: sql<string>`COALESCE(SUM(${sessions.amount}), 0)`,
        })
        .from(sessions)
        .where(
          and(
            ...baseConditions,
            eq(sessions.paymentStatus, "paid")
          )
        );

      // Completed sessions count
      const completedResult = await ctx.db
        .select({
          count: sql<number>`COUNT(*)`,
        })
        .from(sessions)
        .where(
          and(
            ...baseConditions,
            eq(sessions.status, "completed")
          )
        );

      // Cancelled sessions count
      const cancelledResult = await ctx.db
        .select({
          count: sql<number>`COUNT(*)`,
        })
        .from(sessions)
        .where(
          and(
            ...baseConditions,
            eq(sessions.status, "cancelled")
          )
        );

      // Total sessions count
      const totalResult = await ctx.db
        .select({
          count: sql<number>`COUNT(*)`,
        })
        .from(sessions)
        .where(and(...baseConditions));

      const totalRevenue = Number(revenueResult[0]?.total ?? 0);
      const completedCount = Number(completedResult[0]?.count ?? 0);
      const cancelledCount = Number(cancelledResult[0]?.count ?? 0);
      const totalCount = Number(totalResult[0]?.count ?? 0);

      const averagePerSession = completedCount > 0 ? totalRevenue / completedCount : 0;
      const cancellationRate = totalCount > 0 ? (cancelledCount / totalCount) * 100 : 0;

      return {
        totalRevenue,
        completedSessions: completedCount,
        averagePerSession: Math.round(averagePerSession),
        cancellationRate: Math.round(cancellationRate),
        period: {
          from: startDate,
          to: endDate,
          months: input.months,
        },
      };
    }),

  revenueByMonth: therapistProcedure
    .input(
      z.object({
        months: z.number().min(1).max(12).default(6),
      }).default({})
    )
    .query(async ({ ctx, input }) => {
      const now = new Date();
      const monthlyData = [];

      for (let i = input.months - 1; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(now, i));
        const monthEnd = endOfMonth(subMonths(now, i));

        const result = await ctx.db
          .select({
            total: sql<string>`COALESCE(SUM(${sessions.amount}), 0)`,
            count: sql<number>`COUNT(*)`,
          })
          .from(sessions)
          .where(
            and(
              eq(sessions.therapistId, ctx.therapistId),
              eq(sessions.paymentStatus, "paid"),
              gte(sessions.scheduledAt, monthStart),
              lte(sessions.scheduledAt, monthEnd)
            )
          );

        monthlyData.push({
          month: format(monthStart, "MMM yyyy"),
          revenue: Number(result[0]?.total ?? 0),
          sessions: Number(result[0]?.count ?? 0),
        });
      }

      return monthlyData;
    }),

  paymentStatusDistribution: therapistProcedure
    .input(
      z.object({
        from: z.date().optional(),
        to: z.date().optional(),
      }).default({})
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(sessions.therapistId, ctx.therapistId)];

      if (input.from) {
        conditions.push(gte(sessions.scheduledAt, input.from));
      }
      if (input.to) {
        conditions.push(lte(sessions.scheduledAt, input.to));
      }

      const baseWhere = and(...conditions);

      const statuses = ["paid", "pending", "failed", "refunded"] as const;
      const distribution = [];

      for (const status of statuses) {
        const result = await ctx.db
          .select({
            count: sql<number>`COUNT(*)`,
            total: sql<string>`COALESCE(SUM(${sessions.amount}), 0)`,
          })
          .from(sessions)
          .where(and(baseWhere, eq(sessions.paymentStatus, status)));

        distribution.push({
          status,
          count: Number(result[0]?.count ?? 0),
          total: Number(result[0]?.total ?? 0),
        });
      }

      return distribution;
    }),

  topPatients: therapistProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(20).default(10),
        from: z.date().optional(),
        to: z.date().optional(),
      }).default({})
    )
    .query(async ({ ctx, input }) => {
      const conditions = [
        eq(sessions.therapistId, ctx.therapistId),
        eq(sessions.paymentStatus, "paid"),
      ];

      if (input.from) {
        conditions.push(gte(sessions.scheduledAt, input.from));
      }
      if (input.to) {
        conditions.push(lte(sessions.scheduledAt, input.to));
      }

      const result = await ctx.db
        .select({
          patientId: sessions.patientId,
          patientName: patients.name,
          sessionCount: sql<number>`COUNT(*)`,
          totalPaid: sql<string>`SUM(${sessions.amount})`,
          lastSession: sql<Date>`MAX(${sessions.scheduledAt})`,
        })
        .from(sessions)
        .leftJoin(patients, eq(sessions.patientId, patients.id))
        .where(and(...conditions))
        .groupBy(sessions.patientId, patients.name)
        .orderBy(desc(sql`SUM(${sessions.amount})`))
        .limit(input.limit);

      return result.map((row, index) => ({
        rank: index + 1,
        patientId: row.patientId,
        patientName: row.patientName,
        sessionCount: Number(row.sessionCount),
        totalPaid: Number(row.totalPaid),
        lastSession: row.lastSession,
      }));
    }),
});
