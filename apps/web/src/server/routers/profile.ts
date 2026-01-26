import { z } from "zod";
import { router, therapistProcedure, publicProcedure } from "../trpc";
import {
  therapists,
  therapistDegrees,
  therapistCertifications,
  therapistExperience,
  therapistSpecializations,
  therapistApproaches,
  therapistLanguages,
  therapeuticApproaches,
  specializations,
} from "@psico-pay/db/schema";
import { eq, and } from "drizzle-orm";

export const profileRouter = router({
  // Get current therapist's profile
  get: therapistProcedure.query(async ({ ctx }) => {
    const therapist = await ctx.db
      .select()
      .from(therapists)
      .where(eq(therapists.id, ctx.therapistId))
      .limit(1);

    if (therapist.length === 0) {
      return null;
    }

    // Get related data in parallel
    const [degrees, certifications, experience, specList, approachesList, languages] =
      await Promise.all([
        ctx.db
          .select()
          .from(therapistDegrees)
          .where(eq(therapistDegrees.therapistId, ctx.therapistId)),
        ctx.db
          .select()
          .from(therapistCertifications)
          .where(eq(therapistCertifications.therapistId, ctx.therapistId)),
        ctx.db
          .select()
          .from(therapistExperience)
          .where(eq(therapistExperience.therapistId, ctx.therapistId)),
        ctx.db
          .select({
            id: specializations.id,
            name: specializations.name,
            category: specializations.category,
          })
          .from(therapistSpecializations)
          .innerJoin(
            specializations,
            eq(therapistSpecializations.specializationId, specializations.id)
          )
          .where(eq(therapistSpecializations.therapistId, ctx.therapistId)),
        ctx.db
          .select({
            id: therapeuticApproaches.id,
            name: therapeuticApproaches.name,
            acronym: therapeuticApproaches.acronym,
          })
          .from(therapistApproaches)
          .innerJoin(
            therapeuticApproaches,
            eq(therapistApproaches.approachId, therapeuticApproaches.id)
          )
          .where(eq(therapistApproaches.therapistId, ctx.therapistId)),
        ctx.db
          .select()
          .from(therapistLanguages)
          .where(eq(therapistLanguages.therapistId, ctx.therapistId)),
      ]);

    return {
      ...therapist[0],
      degrees,
      certifications,
      experience,
      specializations: specList,
      approaches: approachesList,
      languages,
    };
  }),

  // Update basic info
  updateBasicInfo: therapistProcedure
    .input(
      z.object({
        name: z.string().min(2).max(255).optional(),
        bio: z.string().max(2000).optional().nullable(),
        experienceYears: z.number().min(0).max(50).optional().nullable(),
        slug: z
          .string()
          .min(3)
          .max(50)
          .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only")
          .optional()
          .nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(therapists)
        .set(input)
        .where(eq(therapists.id, ctx.therapistId))
        .returning();

      return updated;
    }),

  // Degrees CRUD
  addDegree: therapistProcedure
    .input(
      z.object({
        degreeType: z.enum(["bachelor", "master", "phd", "md", "specialist", "other"]),
        fieldOfStudy: z.string().min(2).max(200),
        institution: z.string().min(2).max(255),
        graduationYear: z.number().min(1950).max(new Date().getFullYear()).optional(),
        country: z.string().max(100).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [degree] = await ctx.db
        .insert(therapistDegrees)
        .values({
          therapistId: ctx.therapistId,
          ...input,
        })
        .returning();

      return degree;
    }),

  updateDegree: therapistProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        degreeType: z.enum(["bachelor", "master", "phd", "md", "specialist", "other"]).optional(),
        fieldOfStudy: z.string().min(2).max(200).optional(),
        institution: z.string().min(2).max(255).optional(),
        graduationYear: z.number().min(1950).max(new Date().getFullYear()).optional().nullable(),
        country: z.string().max(100).optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const [updated] = await ctx.db
        .update(therapistDegrees)
        .set(data)
        .where(
          and(
            eq(therapistDegrees.id, id),
            eq(therapistDegrees.therapistId, ctx.therapistId)
          )
        )
        .returning();

      return updated;
    }),

  deleteDegree: therapistProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(therapistDegrees)
        .where(
          and(
            eq(therapistDegrees.id, input.id),
            eq(therapistDegrees.therapistId, ctx.therapistId)
          )
        );

      return { success: true };
    }),

  // Certifications CRUD
  addCertification: therapistProcedure
    .input(
      z.object({
        name: z.string().min(2).max(255),
        issuingOrganization: z.string().max(255).optional(),
        issueDate: z.date().optional(),
        expirationDate: z.date().optional(),
        credentialId: z.string().max(100).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [cert] = await ctx.db
        .insert(therapistCertifications)
        .values({
          therapistId: ctx.therapistId,
          ...input,
        })
        .returning();

      return cert;
    }),

  updateCertification: therapistProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(2).max(255).optional(),
        issuingOrganization: z.string().max(255).optional().nullable(),
        issueDate: z.date().optional().nullable(),
        expirationDate: z.date().optional().nullable(),
        credentialId: z.string().max(100).optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const [updated] = await ctx.db
        .update(therapistCertifications)
        .set(data)
        .where(
          and(
            eq(therapistCertifications.id, id),
            eq(therapistCertifications.therapistId, ctx.therapistId)
          )
        )
        .returning();

      return updated;
    }),

  deleteCertification: therapistProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(therapistCertifications)
        .where(
          and(
            eq(therapistCertifications.id, input.id),
            eq(therapistCertifications.therapistId, ctx.therapistId)
          )
        );

      return { success: true };
    }),

  // Experience CRUD
  addExperience: therapistProcedure
    .input(
      z.object({
        position: z.string().min(2).max(200),
        organization: z.string().max(255).optional(),
        startDate: z.date(),
        endDate: z.date().optional(),
        description: z.string().max(1000).optional(),
        isCurrent: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [exp] = await ctx.db
        .insert(therapistExperience)
        .values({
          therapistId: ctx.therapistId,
          ...input,
        })
        .returning();

      return exp;
    }),

  updateExperience: therapistProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        position: z.string().min(2).max(200).optional(),
        organization: z.string().max(255).optional().nullable(),
        startDate: z.date().optional(),
        endDate: z.date().optional().nullable(),
        description: z.string().max(1000).optional().nullable(),
        isCurrent: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const [updated] = await ctx.db
        .update(therapistExperience)
        .set(data)
        .where(
          and(
            eq(therapistExperience.id, id),
            eq(therapistExperience.therapistId, ctx.therapistId)
          )
        )
        .returning();

      return updated;
    }),

  deleteExperience: therapistProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(therapistExperience)
        .where(
          and(
            eq(therapistExperience.id, input.id),
            eq(therapistExperience.therapistId, ctx.therapistId)
          )
        );

      return { success: true };
    }),

  // Languages CRUD
  addLanguage: therapistProcedure
    .input(
      z.object({
        language: z.string().min(2).max(50),
        proficiency: z.enum(["native", "fluent", "conversational", "basic"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [lang] = await ctx.db
        .insert(therapistLanguages)
        .values({
          therapistId: ctx.therapistId,
          ...input,
        })
        .returning();

      return lang;
    }),

  deleteLanguage: therapistProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(therapistLanguages)
        .where(
          and(
            eq(therapistLanguages.id, input.id),
            eq(therapistLanguages.therapistId, ctx.therapistId)
          )
        );

      return { success: true };
    }),

  // Specializations management (many-to-many)
  setSpecializations: therapistProcedure
    .input(z.object({ specializationIds: z.array(z.string().uuid()) }))
    .mutation(async ({ ctx, input }) => {
      // Delete existing
      await ctx.db
        .delete(therapistSpecializations)
        .where(eq(therapistSpecializations.therapistId, ctx.therapistId));

      // Insert new
      if (input.specializationIds.length > 0) {
        await ctx.db.insert(therapistSpecializations).values(
          input.specializationIds.map((id) => ({
            therapistId: ctx.therapistId,
            specializationId: id,
          }))
        );
      }

      return { success: true };
    }),

  // Approaches management (many-to-many)
  setApproaches: therapistProcedure
    .input(z.object({ approachIds: z.array(z.string().uuid()) }))
    .mutation(async ({ ctx, input }) => {
      // Delete existing
      await ctx.db
        .delete(therapistApproaches)
        .where(eq(therapistApproaches.therapistId, ctx.therapistId));

      // Insert new
      if (input.approachIds.length > 0) {
        await ctx.db.insert(therapistApproaches).values(
          input.approachIds.map((id) => ({
            therapistId: ctx.therapistId,
            approachId: id,
          }))
        );
      }

      return { success: true };
    }),

  // Get reference data (for dropdowns)
  getApproaches: therapistProcedure.query(async ({ ctx }) => {
    return ctx.db.select().from(therapeuticApproaches);
  }),

  getSpecializations: therapistProcedure.query(async ({ ctx }) => {
    return ctx.db.select().from(specializations);
  }),

  // Public profile (no auth required)
  getPublicProfile: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const therapist = await ctx.db
        .select({
          id: therapists.id,
          name: therapists.name,
          profilePictureUrl: therapists.profilePictureUrl,
          bio: therapists.bio,
          experienceYears: therapists.experienceYears,
          defaultSessionPrice: therapists.defaultSessionPrice,
          defaultSessionDuration: therapists.defaultSessionDuration,
          currency: therapists.currency,
          slug: therapists.slug,
        })
        .from(therapists)
        .where(and(eq(therapists.slug, input.slug), eq(therapists.isActive, true)))
        .limit(1);

      if (therapist.length === 0) {
        return null;
      }

      const therapistId = therapist[0].id;

      // Get public profile data
      const [degrees, specList, approachesList, languages] = await Promise.all([
        ctx.db
          .select({
            degreeType: therapistDegrees.degreeType,
            fieldOfStudy: therapistDegrees.fieldOfStudy,
            institution: therapistDegrees.institution,
            graduationYear: therapistDegrees.graduationYear,
          })
          .from(therapistDegrees)
          .where(eq(therapistDegrees.therapistId, therapistId)),
        ctx.db
          .select({
            name: specializations.name,
            category: specializations.category,
          })
          .from(therapistSpecializations)
          .innerJoin(
            specializations,
            eq(therapistSpecializations.specializationId, specializations.id)
          )
          .where(eq(therapistSpecializations.therapistId, therapistId)),
        ctx.db
          .select({
            name: therapeuticApproaches.name,
            acronym: therapeuticApproaches.acronym,
          })
          .from(therapistApproaches)
          .innerJoin(
            therapeuticApproaches,
            eq(therapistApproaches.approachId, therapeuticApproaches.id)
          )
          .where(eq(therapistApproaches.therapistId, therapistId)),
        ctx.db
          .select({
            language: therapistLanguages.language,
            proficiency: therapistLanguages.proficiency,
          })
          .from(therapistLanguages)
          .where(eq(therapistLanguages.therapistId, therapistId)),
      ]);

      return {
        ...therapist[0],
        degrees,
        specializations: specList,
        approaches: approachesList,
        languages,
      };
    }),
});
