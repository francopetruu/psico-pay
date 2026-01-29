import { z } from "zod";
import { router, therapistProcedure } from "../trpc";
import {
  therapists,
  availabilityRules,
  availabilityExceptions,
} from "@psico-pay/db/schema";
import { eq, and, gte, lte, asc } from "drizzle-orm";

export const availabilityRouter = router({
  // Get booking settings
  getBookingSettings: therapistProcedure.query(async ({ ctx }) => {
    const settings = await ctx.db
      .select({
        bufferBeforeMinutes: therapists.bufferBeforeMinutes,
        bufferAfterMinutes: therapists.bufferAfterMinutes,
        minAdvanceBookingHours: therapists.minAdvanceBookingHours,
        maxAdvanceBookingDays: therapists.maxAdvanceBookingDays,
        defaultSessionDuration: therapists.defaultSessionDuration,
        timezone: therapists.timezone,
      })
      .from(therapists)
      .where(eq(therapists.id, ctx.therapistId))
      .limit(1);

    return settings[0] || null;
  }),

  // Update booking settings
  updateBookingSettings: therapistProcedure
    .input(
      z.object({
        bufferBeforeMinutes: z.number().min(0).max(60).optional(),
        bufferAfterMinutes: z.number().min(0).max(60).optional(),
        minAdvanceBookingHours: z.number().min(0).max(168).optional(), // max 1 week
        maxAdvanceBookingDays: z.number().min(1).max(365).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updateData: Record<string, unknown> = {};

      if (input.bufferBeforeMinutes !== undefined) {
        updateData.bufferBeforeMinutes = input.bufferBeforeMinutes;
      }
      if (input.bufferAfterMinutes !== undefined) {
        updateData.bufferAfterMinutes = input.bufferAfterMinutes;
      }
      if (input.minAdvanceBookingHours !== undefined) {
        updateData.minAdvanceBookingHours = input.minAdvanceBookingHours;
      }
      if (input.maxAdvanceBookingDays !== undefined) {
        updateData.maxAdvanceBookingDays = input.maxAdvanceBookingDays;
      }

      const [updated] = await ctx.db
        .update(therapists)
        .set(updateData)
        .where(eq(therapists.id, ctx.therapistId))
        .returning();

      return updated;
    }),

  // ===== Availability Rules (Weekly Schedule) =====

  // List all rules
  listRules: therapistProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(availabilityRules)
      .where(eq(availabilityRules.therapistId, ctx.therapistId))
      .orderBy(asc(availabilityRules.dayOfWeek), asc(availabilityRules.startTime));
  }),

  // Create rule
  createRule: therapistProcedure
    .input(
      z.object({
        dayOfWeek: z.number().min(0).max(6), // 0=Sunday, 6=Saturday
        startTime: z.string().regex(/^\d{2}:\d{2}$/), // HH:MM format
        endTime: z.string().regex(/^\d{2}:\d{2}$/),
        isAvailable: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate end time is after start time
      if (input.startTime >= input.endTime) {
        throw new Error("End time must be after start time");
      }

      const [rule] = await ctx.db
        .insert(availabilityRules)
        .values({
          therapistId: ctx.therapistId,
          dayOfWeek: input.dayOfWeek,
          startTime: input.startTime,
          endTime: input.endTime,
          isAvailable: input.isAvailable,
        })
        .returning();

      return rule;
    }),

  // Update rule
  updateRule: therapistProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
        endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
        isAvailable: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      // If updating times, validate
      if (data.startTime && data.endTime && data.startTime >= data.endTime) {
        throw new Error("End time must be after start time");
      }

      const updateData: Record<string, unknown> = {};
      if (data.startTime !== undefined) updateData.startTime = data.startTime;
      if (data.endTime !== undefined) updateData.endTime = data.endTime;
      if (data.isAvailable !== undefined) updateData.isAvailable = data.isAvailable;

      const [updated] = await ctx.db
        .update(availabilityRules)
        .set(updateData)
        .where(
          and(
            eq(availabilityRules.id, id),
            eq(availabilityRules.therapistId, ctx.therapistId)
          )
        )
        .returning();

      return updated;
    }),

  // Delete rule
  deleteRule: therapistProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(availabilityRules)
        .where(
          and(
            eq(availabilityRules.id, input.id),
            eq(availabilityRules.therapistId, ctx.therapistId)
          )
        );

      return { success: true };
    }),

  // ===== Availability Exceptions =====

  // List exceptions in date range
  listExceptions: therapistProcedure
    .input(
      z.object({
        startDate: z.string().optional(), // YYYY-MM-DD
        endDate: z.string().optional(),
      }).default({})
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(availabilityExceptions.therapistId, ctx.therapistId)];

      if (input.startDate) {
        conditions.push(gte(availabilityExceptions.exceptionDate, input.startDate));
      }
      if (input.endDate) {
        conditions.push(lte(availabilityExceptions.exceptionDate, input.endDate));
      }

      return ctx.db
        .select()
        .from(availabilityExceptions)
        .where(and(...conditions))
        .orderBy(asc(availabilityExceptions.exceptionDate));
    }),

  // Create exception
  createException: therapistProcedure
    .input(
      z.object({
        exceptionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
        startTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
        endTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
        allDay: z.boolean().default(false),
        exceptionType: z.enum(["block", "available"]).default("block"),
        reason: z.string().max(500).optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate: if not all_day, times are required
      if (!input.allDay && (!input.startTime || !input.endTime)) {
        throw new Error("Start and end time required for partial-day exceptions");
      }

      // Validate end time is after start time
      if (input.startTime && input.endTime && input.startTime >= input.endTime) {
        throw new Error("End time must be after start time");
      }

      const [exception] = await ctx.db
        .insert(availabilityExceptions)
        .values({
          therapistId: ctx.therapistId,
          exceptionDate: input.exceptionDate,
          startTime: input.allDay ? null : input.startTime,
          endTime: input.allDay ? null : input.endTime,
          allDay: input.allDay,
          exceptionType: input.exceptionType,
          reason: input.reason,
        })
        .returning();

      return exception;
    }),

  // Update exception
  updateException: therapistProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        exceptionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        startTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
        endTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
        allDay: z.boolean().optional(),
        exceptionType: z.enum(["block", "available"]).optional(),
        reason: z.string().max(500).optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const updateData: Record<string, unknown> = {};
      if (data.exceptionDate !== undefined) updateData.exceptionDate = data.exceptionDate;
      if (data.startTime !== undefined) updateData.startTime = data.startTime;
      if (data.endTime !== undefined) updateData.endTime = data.endTime;
      if (data.allDay !== undefined) updateData.allDay = data.allDay;
      if (data.exceptionType !== undefined) updateData.exceptionType = data.exceptionType;
      if (data.reason !== undefined) updateData.reason = data.reason;

      const [updated] = await ctx.db
        .update(availabilityExceptions)
        .set(updateData)
        .where(
          and(
            eq(availabilityExceptions.id, id),
            eq(availabilityExceptions.therapistId, ctx.therapistId)
          )
        )
        .returning();

      return updated;
    }),

  // Delete exception
  deleteException: therapistProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(availabilityExceptions)
        .where(
          and(
            eq(availabilityExceptions.id, input.id),
            eq(availabilityExceptions.therapistId, ctx.therapistId)
          )
        );

      return { success: true };
    }),
});
