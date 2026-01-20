import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { patients, sessions } from "@psico-pay/db/schema";
import { eq, desc, ilike, sql, or } from "drizzle-orm";

const phoneRegex = /^\+[1-9]\d{1,14}$/;

export const patientsRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        search: z.string().optional(),
      }).default({})
    )
    .query(async ({ ctx, input }) => {
      let whereClause;

      if (input.search) {
        const searchTerm = `%${input.search}%`;
        whereClause = or(
          ilike(patients.name, searchTerm),
          ilike(patients.phone, searchTerm),
          ilike(patients.email, searchTerm)
        );
      }

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

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const patient = await ctx.db
        .select()
        .from(patients)
        .where(eq(patients.id, input.id))
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
        .where(eq(sessions.patientId, input.id))
        .orderBy(desc(sessions.scheduledAt))
        .limit(10);

      return {
        ...patient[0],
        recentSessions,
      };
    }),

  create: protectedProcedure
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
          name: input.name,
          phone: input.phone,
          email: input.email,
          notes: input.notes,
          trusted: input.trusted,
        })
        .returning();

      return newPatient;
    }),

  update: protectedProcedure
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
        .where(eq(patients.id, id))
        .returning();

      return updatedPatient;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(patients).where(eq(patients.id, input.id));
      return { success: true };
    }),
});
