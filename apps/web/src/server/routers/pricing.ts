import { z } from "zod";
import { router, therapistProcedure } from "../trpc";
import {
  therapists,
  sessionTypes,
  patientPricing,
  priceHistory,
  patients,
} from "@psico-pay/db/schema";
import { eq, and, desc, lte, gte, or, isNull } from "drizzle-orm";

export const pricingRouter = router({
  // Get therapist's default pricing settings
  getDefaults: therapistProcedure.query(async ({ ctx }) => {
    const therapist = await ctx.db
      .select({
        defaultSessionPrice: therapists.defaultSessionPrice,
        defaultSessionDuration: therapists.defaultSessionDuration,
        currency: therapists.currency,
      })
      .from(therapists)
      .where(eq(therapists.id, ctx.therapistId))
      .limit(1);

    return therapist[0] || null;
  }),

  // Update default pricing
  updateDefaults: therapistProcedure
    .input(
      z.object({
        defaultSessionPrice: z.number().min(0).optional(),
        defaultSessionDuration: z.number().min(15).max(240).optional(),
        currency: z.string().length(3).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get current values for history
      const current = await ctx.db
        .select({
          defaultSessionPrice: therapists.defaultSessionPrice,
        })
        .from(therapists)
        .where(eq(therapists.id, ctx.therapistId))
        .limit(1);

      const oldPrice = current[0]?.defaultSessionPrice;

      // Update therapist defaults
      const updateData: Record<string, unknown> = {};
      if (input.defaultSessionPrice !== undefined) {
        updateData.defaultSessionPrice = input.defaultSessionPrice.toString();
      }
      if (input.defaultSessionDuration !== undefined) {
        updateData.defaultSessionDuration = input.defaultSessionDuration;
      }
      if (input.currency !== undefined) {
        updateData.currency = input.currency;
      }

      const [updated] = await ctx.db
        .update(therapists)
        .set(updateData)
        .where(eq(therapists.id, ctx.therapistId))
        .returning();

      // Record price history if price changed
      if (input.defaultSessionPrice !== undefined && oldPrice !== input.defaultSessionPrice.toString()) {
        await ctx.db.insert(priceHistory).values({
          therapistId: ctx.therapistId,
          entityType: "therapist",
          entityId: ctx.therapistId,
          oldPrice: oldPrice || null,
          newPrice: input.defaultSessionPrice.toString(),
        });
      }

      return updated;
    }),

  // Session Types CRUD
  listSessionTypes: therapistProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(sessionTypes)
      .where(eq(sessionTypes.therapistId, ctx.therapistId))
      .orderBy(sessionTypes.name);
  }),

  createSessionType: therapistProcedure
    .input(
      z.object({
        name: z.string().min(2).max(100),
        description: z.string().max(500).optional(),
        durationMinutes: z.number().min(15).max(240).default(50),
        price: z.number().min(0).optional().nullable(), // null = use default
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [sessionType] = await ctx.db
        .insert(sessionTypes)
        .values({
          therapistId: ctx.therapistId,
          name: input.name,
          description: input.description,
          durationMinutes: input.durationMinutes,
          price: input.price !== null && input.price !== undefined ? input.price.toString() : null,
        })
        .returning();

      // Record in price history if price was set
      if (input.price !== null && input.price !== undefined) {
        await ctx.db.insert(priceHistory).values({
          therapistId: ctx.therapistId,
          entityType: "session_type",
          entityId: sessionType.id,
          oldPrice: null,
          newPrice: input.price.toString(),
        });
      }

      return sessionType;
    }),

  updateSessionType: therapistProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(2).max(100).optional(),
        description: z.string().max(500).optional().nullable(),
        durationMinutes: z.number().min(15).max(240).optional(),
        price: z.number().min(0).optional().nullable(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      // Get current price for history
      const current = await ctx.db
        .select({ price: sessionTypes.price })
        .from(sessionTypes)
        .where(
          and(
            eq(sessionTypes.id, id),
            eq(sessionTypes.therapistId, ctx.therapistId)
          )
        )
        .limit(1);

      const oldPrice = current[0]?.price;
      const updateData: Record<string, unknown> = {};

      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.durationMinutes !== undefined) updateData.durationMinutes = data.durationMinutes;
      if (data.price !== undefined) {
        updateData.price = data.price !== null ? data.price.toString() : null;
      }
      if (data.isActive !== undefined) updateData.isActive = data.isActive;

      const [updated] = await ctx.db
        .update(sessionTypes)
        .set(updateData)
        .where(
          and(
            eq(sessionTypes.id, id),
            eq(sessionTypes.therapistId, ctx.therapistId)
          )
        )
        .returning();

      // Record price history if price changed
      if (data.price !== undefined) {
        const newPrice = data.price !== null ? data.price.toString() : null;
        if (oldPrice !== newPrice) {
          await ctx.db.insert(priceHistory).values({
            therapistId: ctx.therapistId,
            entityType: "session_type",
            entityId: id,
            oldPrice: oldPrice || null,
            newPrice: newPrice || "0",
          });
        }
      }

      return updated;
    }),

  deleteSessionType: therapistProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(sessionTypes)
        .where(
          and(
            eq(sessionTypes.id, input.id),
            eq(sessionTypes.therapistId, ctx.therapistId)
          )
        );

      return { success: true };
    }),

  // Patient Pricing
  getPatientPricing: therapistProcedure
    .input(z.object({ patientId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const pricing = await ctx.db
        .select()
        .from(patientPricing)
        .where(
          and(
            eq(patientPricing.patientId, input.patientId),
            eq(patientPricing.therapistId, ctx.therapistId)
          )
        )
        .limit(1);

      return pricing[0] || null;
    }),

  setPatientPricing: therapistProcedure
    .input(
      z.object({
        patientId: z.string().uuid(),
        price: z.number().min(0),
        reason: z.string().max(500).optional().nullable(),
        validFrom: z.date().optional().nullable(),
        validUntil: z.date().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if patient belongs to therapist
      const patient = await ctx.db
        .select({ id: patients.id })
        .from(patients)
        .where(
          and(
            eq(patients.id, input.patientId),
            eq(patients.therapistId, ctx.therapistId)
          )
        )
        .limit(1);

      if (patient.length === 0) {
        throw new Error("Patient not found");
      }

      // Check for existing pricing
      const existing = await ctx.db
        .select()
        .from(patientPricing)
        .where(
          and(
            eq(patientPricing.patientId, input.patientId),
            eq(patientPricing.therapistId, ctx.therapistId)
          )
        )
        .limit(1);

      let result;
      const oldPrice = existing[0]?.price;

      if (existing.length > 0) {
        // Update existing
        [result] = await ctx.db
          .update(patientPricing)
          .set({
            price: input.price.toString(),
            reason: input.reason,
            validFrom: input.validFrom,
            validUntil: input.validUntil,
            isActive: true,
          })
          .where(eq(patientPricing.id, existing[0].id))
          .returning();
      } else {
        // Create new
        [result] = await ctx.db
          .insert(patientPricing)
          .values({
            patientId: input.patientId,
            therapistId: ctx.therapistId,
            price: input.price.toString(),
            reason: input.reason,
            validFrom: input.validFrom,
            validUntil: input.validUntil,
          })
          .returning();
      }

      // Record price history
      if (oldPrice !== input.price.toString()) {
        await ctx.db.insert(priceHistory).values({
          therapistId: ctx.therapistId,
          entityType: "patient",
          entityId: input.patientId,
          oldPrice: oldPrice || null,
          newPrice: input.price.toString(),
        });
      }

      return result;
    }),

  removePatientPricing: therapistProcedure
    .input(z.object({ patientId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Get current price for history
      const existing = await ctx.db
        .select({ price: patientPricing.price })
        .from(patientPricing)
        .where(
          and(
            eq(patientPricing.patientId, input.patientId),
            eq(patientPricing.therapistId, ctx.therapistId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        // Record removal in history
        await ctx.db.insert(priceHistory).values({
          therapistId: ctx.therapistId,
          entityType: "patient",
          entityId: input.patientId,
          oldPrice: existing[0].price,
          newPrice: "0", // Indicates removal
        });

        // Delete the pricing
        await ctx.db
          .delete(patientPricing)
          .where(
            and(
              eq(patientPricing.patientId, input.patientId),
              eq(patientPricing.therapistId, ctx.therapistId)
            )
          );
      }

      return { success: true };
    }),

  // Price History
  getPriceHistory: therapistProcedure
    .input(
      z.object({
        entityType: z.enum(["therapist", "session_type", "patient"]).optional(),
        entityId: z.string().uuid().optional(),
        limit: z.number().min(1).max(100).default(20),
      }).default({})
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(priceHistory.therapistId, ctx.therapistId)];

      if (input.entityType) {
        conditions.push(eq(priceHistory.entityType, input.entityType));
      }
      if (input.entityId) {
        conditions.push(eq(priceHistory.entityId, input.entityId));
      }

      return ctx.db
        .select()
        .from(priceHistory)
        .where(and(...conditions))
        .orderBy(desc(priceHistory.changedAt))
        .limit(input.limit);
    }),

  // Calculate price for a session
  calculatePrice: therapistProcedure
    .input(
      z.object({
        patientId: z.string().uuid(),
        sessionTypeId: z.string().uuid().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const now = new Date();

      // 1. Check patient-specific pricing first
      const patientPrice = await ctx.db
        .select({ price: patientPricing.price, reason: patientPricing.reason })
        .from(patientPricing)
        .where(
          and(
            eq(patientPricing.patientId, input.patientId),
            eq(patientPricing.therapistId, ctx.therapistId),
            eq(patientPricing.isActive, true),
            or(
              isNull(patientPricing.validFrom),
              lte(patientPricing.validFrom, now)
            ),
            or(
              isNull(patientPricing.validUntil),
              gte(patientPricing.validUntil, now)
            )
          )
        )
        .limit(1);

      if (patientPrice.length > 0 && patientPrice[0].price) {
        return {
          price: Number(patientPrice[0].price),
          source: "patient" as const,
          reason: patientPrice[0].reason,
        };
      }

      // 2. Check session type pricing if provided
      if (input.sessionTypeId) {
        const sessionTypePrice = await ctx.db
          .select({ price: sessionTypes.price, name: sessionTypes.name })
          .from(sessionTypes)
          .where(
            and(
              eq(sessionTypes.id, input.sessionTypeId),
              eq(sessionTypes.therapistId, ctx.therapistId),
              eq(sessionTypes.isActive, true)
            )
          )
          .limit(1);

        if (sessionTypePrice.length > 0 && sessionTypePrice[0].price) {
          return {
            price: Number(sessionTypePrice[0].price),
            source: "session_type" as const,
            sessionTypeName: sessionTypePrice[0].name,
          };
        }
      }

      // 3. Return therapist default price
      const defaultPrice = await ctx.db
        .select({ defaultSessionPrice: therapists.defaultSessionPrice })
        .from(therapists)
        .where(eq(therapists.id, ctx.therapistId))
        .limit(1);

      return {
        price: Number(defaultPrice[0]?.defaultSessionPrice ?? 0),
        source: "default" as const,
      };
    }),
});
