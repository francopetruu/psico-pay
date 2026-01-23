import { z } from "zod";
import { router, therapistProcedure } from "../trpc";
import { patients, sessions } from "@psico-pay/db/schema";
import { eq, desc, ilike, sql, or, and } from "drizzle-orm";

const phoneRegex = /^\+[1-9]\d{1,14}$/;

export const patientsRouter = router({
  list: therapistProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        search: z.string().optional(),
      }).default({})
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(patients.therapistId, ctx.therapistId)];

      if (input.search) {
        const searchTerm = `%${input.search}%`;
        conditions.push(
          or(
            ilike(patients.name, searchTerm),
            ilike(patients.phone, searchTerm),
            ilike(patients.email, searchTerm)
          )!
        );
      }

      const whereClause = and(...conditions);

      const [patientList, countResult] = await Promise.all([
        ctx.db
          .select()
          .from(patients)
          .where(whereClause)
          .orderBy(desc(patients.lastSessionAt), desc(patients.createdAt))
          .limit(input.limit)
          .offset(input.offset),
        ctx.db
          .select({ count: sql<number>`count(*)` })
          .from(patients)
          .where(whereClause),
      ]);

      return {
        patients: patientList,
        total: Number(countResult[0]?.count ?? 0),
      };
    }),

  getById: therapistProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const patient = await ctx.db
        .select()
        .from(patients)
        .where(
          and(
            eq(patients.id, input.id),
            eq(patients.therapistId, ctx.therapistId)
          )
        )
        .limit(1);

      if (patient.length === 0) {
        return null;
      }

      // Get recent sessions for this patient
      const recentSessions = await ctx.db
        .select({
          id: sessions.id,
          scheduledAt: sessions.scheduledAt,
          status: sessions.status,
          paymentStatus: sessions.paymentStatus,
          amount: sessions.amount,
        })
        .from(sessions)
        .where(
          and(
            eq(sessions.patientId, input.id),
            eq(sessions.therapistId, ctx.therapistId)
          )
        )
        .orderBy(desc(sessions.scheduledAt))
        .limit(10);

      return {
        ...patient[0],
        recentSessions,
      };
    }),

  create: therapistProcedure
    .input(
      z.object({
        name: z.string().min(2).max(255),
        phone: z.string().regex(phoneRegex, "Phone must be in E.164 format (e.g., +5491112345678)"),
        email: z.string().email().optional().nullable(),
        notes: z.string().optional().nullable(),
        trusted: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [newPatient] = await ctx.db
        .insert(patients)
        .values({
          therapistId: ctx.therapistId,
          name: input.name,
          phone: input.phone,
          email: input.email,
          notes: input.notes,
          trusted: input.trusted,
        })
        .returning();

      return newPatient;
    }),

  update: therapistProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(2).max(255).optional(),
        phone: z.string().regex(phoneRegex, "Phone must be in E.164 format").optional(),
        email: z.string().email().optional().nullable(),
        notes: z.string().optional().nullable(),
        trusted: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const [updatedPatient] = await ctx.db
        .update(patients)
        .set(data)
        .where(
          and(
            eq(patients.id, id),
            eq(patients.therapistId, ctx.therapistId)
          )
        )
        .returning();

      return updatedPatient;
    }),

  delete: therapistProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(patients)
        .where(
          and(
            eq(patients.id, input.id),
            eq(patients.therapistId, ctx.therapistId)
          )
        );
      return { success: true };
    }),
});
