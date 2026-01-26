import { notFound } from "next/navigation";
import Image from "next/image";
import { getDb } from "@/lib/db";
import {
  therapists,
  therapistDegrees,
  therapistSpecializations,
  therapistApproaches,
  therapistLanguages,
  specializations,
  therapeuticApproaches,
} from "@psico-pay/db/schema";
import { eq, and } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  GraduationCap,
  Brain,
  Globe,
  Clock,
  DollarSign,
  Calendar,
  User,
} from "lucide-react";

const DEGREE_TYPES = {
  bachelor: "Licenciatura",
  master: "Maestria",
  phd: "Doctorado",
  md: "Medicina",
  specialist: "Especialista",
  other: "Titulo",
};

const PROFICIENCY_LEVELS = {
  native: "Nativo",
  fluent: "Fluido",
  conversational: "Conversacional",
  basic: "Basico",
};

async function getPublicProfile(slug: string) {
  const db = getDb();

  const therapist = await db
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
    .where(and(eq(therapists.slug, slug), eq(therapists.isActive, true)))
    .limit(1);

  if (therapist.length === 0) {
    return null;
  }

  const therapistId = therapist[0].id;

  const [degrees, specList, approachesList, languages] = await Promise.all([
    db
      .select({
        degreeType: therapistDegrees.degreeType,
        fieldOfStudy: therapistDegrees.fieldOfStudy,
        institution: therapistDegrees.institution,
        graduationYear: therapistDegrees.graduationYear,
      })
      .from(therapistDegrees)
      .where(eq(therapistDegrees.therapistId, therapistId)),
    db
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
    db
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
    db
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
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profile = await getPublicProfile(slug);

  if (!profile) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden relative">
              {profile.profilePictureUrl ? (
                <Image
                  src={profile.profilePictureUrl}
                  alt={profile.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <User className="w-16 h-16 text-primary" />
              )}
            </div>
            <div className="text-center md:text-left flex-1">
              <h1 className="text-3xl font-bold">{profile.name}</h1>
              {profile.degrees?.[0] && (
                <p className="text-lg text-muted-foreground">
                  {DEGREE_TYPES[profile.degrees[0].degreeType as keyof typeof DEGREE_TYPES]} en{" "}
                  {profile.degrees[0].fieldOfStudy}
                </p>
              )}
              {profile.experienceYears && (
                <p className="text-muted-foreground">
                  {profile.experienceYears} anos de experiencia
                </p>
              )}
            </div>
            <div className="text-center">
              <Button size="lg" className="text-lg px-8">
                <Calendar className="mr-2 h-5 w-5" />
                Agendar Sesion
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* About */}
            {profile.bio && (
              <Card>
                <CardHeader>
                  <CardTitle>Sobre Mi</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{profile.bio}</p>
                </CardContent>
              </Card>
            )}

            {/* Specializations */}
            {profile.specializations && profile.specializations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Especialidades
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {profile.specializations.map((spec, i) => (
                      <Badge key={i} variant="secondary">
                        {spec.name}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Approaches */}
            {profile.approaches && profile.approaches.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Enfoques Terapeuticos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {profile.approaches.map((approach, i) => (
                      <Badge key={i} variant="outline">
                        {approach.name}
                        {approach.acronym && ` (${approach.acronym})`}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Education */}
            {profile.degrees && profile.degrees.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    Formacion Academica
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {profile.degrees.map((degree, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <GraduationCap className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <p className="font-medium">
                            {DEGREE_TYPES[degree.degreeType as keyof typeof DEGREE_TYPES]} en{" "}
                            {degree.fieldOfStudy}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {degree.institution}
                            {degree.graduationYear && ` (${degree.graduationYear})`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Languages */}
            {profile.languages && profile.languages.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Idiomas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {profile.languages.map((lang, i) => (
                      <Badge key={i} variant="secondary">
                        {lang.language} (
                        {PROFICIENCY_LEVELS[lang.proficiency as keyof typeof PROFICIENCY_LEVELS]})
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informacion de Consulta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">
                      {profile.currency} {Number(profile.defaultSessionPrice).toLocaleString("es-AR")}
                    </p>
                    <p className="text-sm text-muted-foreground">por sesion</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{profile.defaultSessionDuration} minutos</p>
                    <p className="text-sm text-muted-foreground">duracion de sesion</p>
                  </div>
                </div>
                <Button className="w-full" size="lg">
                  <Calendar className="mr-2 h-4 w-4" />
                  Agendar Sesion
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-white mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>Powered by PsicoPay</p>
        </div>
      </footer>
    </div>
  );
}
