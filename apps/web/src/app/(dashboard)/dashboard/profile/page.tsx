"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import {
  User,
  GraduationCap,
  Award,
  Briefcase,
  Brain,
  Languages,
  Globe,
  Plus,
  Trash2,
  Save,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const DEGREE_TYPES = {
  bachelor: "Licenciatura",
  master: "Maestria",
  phd: "Doctorado",
  md: "Medicina",
  specialist: "Especialista",
  other: "Otro",
};

const PROFICIENCY_LEVELS = {
  native: "Nativo",
  fluent: "Fluido",
  conversational: "Conversacional",
  basic: "Basico",
};

export default function ProfilePage() {
  const utils = trpc.useUtils();
  const { data: profile, isLoading } = trpc.profile.get.useQuery();
  const { data: allApproaches } = trpc.profile.getApproaches.useQuery();
  const { data: allSpecializations } = trpc.profile.getSpecializations.useQuery();

  const updateBasicInfo = trpc.profile.updateBasicInfo.useMutation({
    onSuccess: () => utils.profile.get.invalidate(),
  });

  const addDegree = trpc.profile.addDegree.useMutation({
    onSuccess: () => utils.profile.get.invalidate(),
  });

  const deleteDegree = trpc.profile.deleteDegree.useMutation({
    onSuccess: () => utils.profile.get.invalidate(),
  });

  const addCertification = trpc.profile.addCertification.useMutation({
    onSuccess: () => utils.profile.get.invalidate(),
  });

  const deleteCertification = trpc.profile.deleteCertification.useMutation({
    onSuccess: () => utils.profile.get.invalidate(),
  });

  const addExperience = trpc.profile.addExperience.useMutation({
    onSuccess: () => utils.profile.get.invalidate(),
  });

  const deleteExperience = trpc.profile.deleteExperience.useMutation({
    onSuccess: () => utils.profile.get.invalidate(),
  });

  const addLanguage = trpc.profile.addLanguage.useMutation({
    onSuccess: () => utils.profile.get.invalidate(),
  });

  const deleteLanguage = trpc.profile.deleteLanguage.useMutation({
    onSuccess: () => utils.profile.get.invalidate(),
  });

  const setApproaches = trpc.profile.setApproaches.useMutation({
    onSuccess: () => utils.profile.get.invalidate(),
  });

  const setSpecializations = trpc.profile.setSpecializations.useMutation({
    onSuccess: () => utils.profile.get.invalidate(),
  });

  // Form states
  const [basicInfo, setBasicInfo] = useState({
    name: "",
    bio: "",
    experienceYears: "",
    slug: "",
  });

  // Dialog states
  const [showDegreeDialog, setShowDegreeDialog] = useState(false);
  const [showCertDialog, setShowCertDialog] = useState(false);
  const [showExpDialog, setShowExpDialog] = useState(false);
  const [showLangDialog, setShowLangDialog] = useState(false);

  // Selected approaches and specializations
  const [selectedApproaches, setSelectedApproaches] = useState<string[]>([]);
  const [selectedSpecializations, setSelectedSpecializations] = useState<string[]>([]);

  // Initialize form when profile loads
  useState(() => {
    if (profile) {
      setBasicInfo({
        name: profile.name || "",
        bio: profile.bio || "",
        experienceYears: profile.experienceYears?.toString() || "",
        slug: profile.slug || "",
      });
      setSelectedApproaches(profile.approaches?.map((a) => a.id) || []);
      setSelectedSpecializations(profile.specializations?.map((s) => s.id) || []);
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Cargando perfil...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">No se encontro el perfil</p>
      </div>
    );
  }

  const handleSaveBasicInfo = async () => {
    await updateBasicInfo.mutateAsync({
      name: basicInfo.name || undefined,
      bio: basicInfo.bio || null,
      experienceYears: basicInfo.experienceYears ? parseInt(basicInfo.experienceYears) : null,
      slug: basicInfo.slug || null,
    });
  };

  const handleSaveApproaches = async () => {
    await setApproaches.mutateAsync({ approachIds: selectedApproaches });
  };

  const handleSaveSpecializations = async () => {
    await setSpecializations.mutateAsync({ specializationIds: selectedSpecializations });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mi Perfil</h1>
          <p className="text-muted-foreground">
            Gestiona tu informacion profesional
          </p>
        </div>
        {profile.slug && (
          <Button variant="outline" asChild>
            <a href={`/${profile.slug}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Ver Perfil Publico
            </a>
          </Button>
        )}
      </div>

      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="basic">
            <User className="mr-2 h-4 w-4" />
            Basico
          </TabsTrigger>
          <TabsTrigger value="degrees">
            <GraduationCap className="mr-2 h-4 w-4" />
            Formacion
          </TabsTrigger>
          <TabsTrigger value="certifications">
            <Award className="mr-2 h-4 w-4" />
            Certificaciones
          </TabsTrigger>
          <TabsTrigger value="experience">
            <Briefcase className="mr-2 h-4 w-4" />
            Experiencia
          </TabsTrigger>
          <TabsTrigger value="specializations">
            <Brain className="mr-2 h-4 w-4" />
            Enfoques
          </TabsTrigger>
          <TabsTrigger value="languages">
            <Languages className="mr-2 h-4 w-4" />
            Idiomas
          </TabsTrigger>
        </TabsList>

        {/* Basic Info Tab */}
        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle>Informacion Basica</CardTitle>
              <CardDescription>
                Tu informacion personal y profesional
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre completo</Label>
                  <Input
                    id="name"
                    value={basicInfo.name || profile.name}
                    onChange={(e) => setBasicInfo({ ...basicInfo, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={profile.email} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="experienceYears">Anos de experiencia</Label>
                  <Input
                    id="experienceYears"
                    type="number"
                    min="0"
                    max="50"
                    value={basicInfo.experienceYears || profile.experienceYears || ""}
                    onChange={(e) => setBasicInfo({ ...basicInfo, experienceYears: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">URL Personalizada</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">psicopay.com/</span>
                    <Input
                      id="slug"
                      placeholder="mi-perfil"
                      value={basicInfo.slug || profile.slug || ""}
                      onChange={(e) => setBasicInfo({ ...basicInfo, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Sobre Mi</Label>
                <Textarea
                  id="bio"
                  placeholder="Describe tu enfoque terapeutico y experiencia..."
                  className="min-h-[150px]"
                  value={basicInfo.bio || profile.bio || ""}
                  onChange={(e) => setBasicInfo({ ...basicInfo, bio: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Maximo 2000 caracteres
                </p>
              </div>
              <Button
                onClick={handleSaveBasicInfo}
                disabled={updateBasicInfo.isPending}
              >
                <Save className="mr-2 h-4 w-4" />
                {updateBasicInfo.isPending ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Degrees Tab */}
        <TabsContent value="degrees">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Formacion Academica</CardTitle>
                  <CardDescription>
                    Tus titulos y estudios universitarios
                  </CardDescription>
                </div>
                <AddDegreeDialog
                  open={showDegreeDialog}
                  onOpenChange={setShowDegreeDialog}
                  onAdd={(degree) => addDegree.mutate(degree)}
                  isPending={addDegree.isPending}
                />
              </div>
            </CardHeader>
            <CardContent>
              {profile.degrees?.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No has agregado ninguna formacion academica
                </p>
              ) : (
                <div className="space-y-4">
                  {profile.degrees?.map((degree) => (
                    <div
                      key={degree.id}
                      className="flex items-start justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-start gap-4">
                        <GraduationCap className="h-5 w-5 text-primary mt-1" />
                        <div>
                          <h4 className="font-medium">
                            {DEGREE_TYPES[degree.degreeType as keyof typeof DEGREE_TYPES]} en {degree.fieldOfStudy}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {degree.institution}
                            {degree.graduationYear && ` (${degree.graduationYear})`}
                          </p>
                          {degree.country && (
                            <p className="text-xs text-muted-foreground">{degree.country}</p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteDegree.mutate({ id: degree.id })}
                        disabled={deleteDegree.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Certifications Tab */}
        <TabsContent value="certifications">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Certificaciones</CardTitle>
                  <CardDescription>
                    Cursos, diplomados y certificaciones adicionales
                  </CardDescription>
                </div>
                <AddCertificationDialog
                  open={showCertDialog}
                  onOpenChange={setShowCertDialog}
                  onAdd={(cert) => addCertification.mutate(cert)}
                  isPending={addCertification.isPending}
                />
              </div>
            </CardHeader>
            <CardContent>
              {profile.certifications?.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No has agregado ninguna certificacion
                </p>
              ) : (
                <div className="space-y-4">
                  {profile.certifications?.map((cert) => (
                    <div
                      key={cert.id}
                      className="flex items-start justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-start gap-4">
                        <Award className="h-5 w-5 text-primary mt-1" />
                        <div>
                          <h4 className="font-medium">{cert.name}</h4>
                          {cert.issuingOrganization && (
                            <p className="text-sm text-muted-foreground">
                              {cert.issuingOrganization}
                            </p>
                          )}
                          {cert.issueDate && (
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(cert.issueDate), "MMMM yyyy", { locale: es })}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteCertification.mutate({ id: cert.id })}
                        disabled={deleteCertification.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Experience Tab */}
        <TabsContent value="experience">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Experiencia Laboral</CardTitle>
                  <CardDescription>
                    Tu trayectoria profesional
                  </CardDescription>
                </div>
                <AddExperienceDialog
                  open={showExpDialog}
                  onOpenChange={setShowExpDialog}
                  onAdd={(exp) => addExperience.mutate(exp)}
                  isPending={addExperience.isPending}
                />
              </div>
            </CardHeader>
            <CardContent>
              {profile.experience?.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No has agregado experiencia laboral
                </p>
              ) : (
                <div className="space-y-4">
                  {profile.experience?.map((exp) => (
                    <div
                      key={exp.id}
                      className="flex items-start justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-start gap-4">
                        <Briefcase className="h-5 w-5 text-primary mt-1" />
                        <div>
                          <h4 className="font-medium">
                            {exp.position}
                            {exp.isCurrent && (
                              <Badge variant="secondary" className="ml-2">Actual</Badge>
                            )}
                          </h4>
                          {exp.organization && (
                            <p className="text-sm text-muted-foreground">
                              {exp.organization}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(exp.startDate), "MMMM yyyy", { locale: es })} -{" "}
                            {exp.isCurrent
                              ? "Presente"
                              : exp.endDate
                                ? format(new Date(exp.endDate), "MMMM yyyy", { locale: es })
                                : ""}
                          </p>
                          {exp.description && (
                            <p className="text-sm mt-2">{exp.description}</p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteExperience.mutate({ id: exp.id })}
                        disabled={deleteExperience.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Specializations & Approaches Tab */}
        <TabsContent value="specializations">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Enfoques Terapeuticos</CardTitle>
                <CardDescription>
                  Selecciona los enfoques que utilizas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {allApproaches?.map((approach) => (
                    <div key={approach.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`approach-${approach.id}`}
                        checked={selectedApproaches.includes(approach.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedApproaches([...selectedApproaches, approach.id]);
                          } else {
                            setSelectedApproaches(selectedApproaches.filter((id) => id !== approach.id));
                          }
                        }}
                      />
                      <Label htmlFor={`approach-${approach.id}`} className="text-sm font-normal">
                        {approach.name}
                        {approach.acronym && (
                          <span className="text-muted-foreground ml-1">({approach.acronym})</span>
                        )}
                      </Label>
                    </div>
                  ))}
                  <Button
                    onClick={handleSaveApproaches}
                    disabled={setApproaches.isPending}
                    className="w-full mt-4"
                  >
                    {setApproaches.isPending ? "Guardando..." : "Guardar Enfoques"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Especializaciones</CardTitle>
                <CardDescription>
                  Selecciona tus areas de especializacion
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[400px] overflow-y-auto">
                  {["mental_health", "age_group", "modality", "other"].map((category) => {
                    const categorySpecs = allSpecializations?.filter((s) => s.category === category) || [];
                    if (categorySpecs.length === 0) return null;

                    const categoryNames = {
                      mental_health: "Salud Mental",
                      age_group: "Grupos de Edad",
                      modality: "Modalidades",
                      other: "Otras",
                    };

                    return (
                      <div key={category}>
                        <h4 className="font-medium text-sm mb-2">
                          {categoryNames[category as keyof typeof categoryNames]}
                        </h4>
                        <div className="space-y-2 ml-2">
                          {categorySpecs.map((spec) => (
                            <div key={spec.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`spec-${spec.id}`}
                                checked={selectedSpecializations.includes(spec.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedSpecializations([...selectedSpecializations, spec.id]);
                                  } else {
                                    setSelectedSpecializations(
                                      selectedSpecializations.filter((id) => id !== spec.id)
                                    );
                                  }
                                }}
                              />
                              <Label htmlFor={`spec-${spec.id}`} className="text-sm font-normal">
                                {spec.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  <Button
                    onClick={handleSaveSpecializations}
                    disabled={setSpecializations.isPending}
                    className="w-full mt-4"
                  >
                    {setSpecializations.isPending ? "Guardando..." : "Guardar Especializaciones"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Languages Tab */}
        <TabsContent value="languages">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Idiomas</CardTitle>
                  <CardDescription>
                    Idiomas en los que puedes atender
                  </CardDescription>
                </div>
                <AddLanguageDialog
                  open={showLangDialog}
                  onOpenChange={setShowLangDialog}
                  onAdd={(lang) => addLanguage.mutate(lang)}
                  isPending={addLanguage.isPending}
                />
              </div>
            </CardHeader>
            <CardContent>
              {profile.languages?.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No has agregado ningun idioma
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile.languages?.map((lang) => (
                    <Badge
                      key={lang.id}
                      variant="secondary"
                      className="flex items-center gap-2 py-2 px-3"
                    >
                      <Globe className="h-4 w-4" />
                      {lang.language} ({PROFICIENCY_LEVELS[lang.proficiency as keyof typeof PROFICIENCY_LEVELS]})
                      <button
                        onClick={() => deleteLanguage.mutate({ id: lang.id })}
                        className="ml-1 hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Dialog Components

function AddDegreeDialog({
  open,
  onOpenChange,
  onAdd,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (degree: {
    degreeType: "bachelor" | "master" | "phd" | "md" | "specialist" | "other";
    fieldOfStudy: string;
    institution: string;
    graduationYear?: number;
    country?: string;
  }) => void;
  isPending: boolean;
}) {
  const [form, setForm] = useState({
    degreeType: "bachelor" as const,
    fieldOfStudy: "",
    institution: "",
    graduationYear: "",
    country: "",
  });

  const handleSubmit = () => {
    onAdd({
      degreeType: form.degreeType,
      fieldOfStudy: form.fieldOfStudy,
      institution: form.institution,
      graduationYear: form.graduationYear ? parseInt(form.graduationYear) : undefined,
      country: form.country || undefined,
    });
    setForm({
      degreeType: "bachelor",
      fieldOfStudy: "",
      institution: "",
      graduationYear: "",
      country: "",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Agregar Titulo
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar Formacion Academica</DialogTitle>
          <DialogDescription>
            Agrega un nuevo titulo o estudio universitario
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Tipo de Titulo</Label>
            <Select
              value={form.degreeType}
              onValueChange={(value) => setForm({ ...form, degreeType: value as typeof form.degreeType })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DEGREE_TYPES).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Campo de Estudio</Label>
            <Input
              placeholder="Ej: Psicologia Clinica"
              value={form.fieldOfStudy}
              onChange={(e) => setForm({ ...form, fieldOfStudy: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Institucion</Label>
            <Input
              placeholder="Ej: Universidad de Buenos Aires"
              value={form.institution}
              onChange={(e) => setForm({ ...form, institution: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ano de Graduacion</Label>
              <Input
                type="number"
                placeholder="2020"
                value={form.graduationYear}
                onChange={(e) => setForm({ ...form, graduationYear: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Pais</Label>
              <Input
                placeholder="Argentina"
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !form.fieldOfStudy || !form.institution}
          >
            {isPending ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddCertificationDialog({
  open,
  onOpenChange,
  onAdd,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (cert: {
    name: string;
    issuingOrganization?: string;
    issueDate?: Date;
  }) => void;
  isPending: boolean;
}) {
  const [form, setForm] = useState({
    name: "",
    issuingOrganization: "",
    issueDate: "",
  });

  const handleSubmit = () => {
    onAdd({
      name: form.name,
      issuingOrganization: form.issuingOrganization || undefined,
      issueDate: form.issueDate ? new Date(form.issueDate) : undefined,
    });
    setForm({ name: "", issuingOrganization: "", issueDate: "" });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Agregar Certificacion
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar Certificacion</DialogTitle>
          <DialogDescription>
            Agrega un curso, diplomado o certificacion
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Nombre del Curso/Certificacion</Label>
            <Input
              placeholder="Ej: Especialista en Terapia EMDR"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Organizacion Emisora</Label>
            <Input
              placeholder="Ej: EMDR Institute"
              value={form.issuingOrganization}
              onChange={(e) => setForm({ ...form, issuingOrganization: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Fecha de Emision</Label>
            <Input
              type="date"
              value={form.issueDate}
              onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || !form.name}>
            {isPending ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddExperienceDialog({
  open,
  onOpenChange,
  onAdd,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (exp: {
    position: string;
    organization?: string;
    startDate: Date;
    endDate?: Date;
    description?: string;
    isCurrent: boolean;
  }) => void;
  isPending: boolean;
}) {
  const [form, setForm] = useState({
    position: "",
    organization: "",
    startDate: "",
    endDate: "",
    description: "",
    isCurrent: false,
  });

  const handleSubmit = () => {
    onAdd({
      position: form.position,
      organization: form.organization || undefined,
      startDate: new Date(form.startDate),
      endDate: form.endDate && !form.isCurrent ? new Date(form.endDate) : undefined,
      description: form.description || undefined,
      isCurrent: form.isCurrent,
    });
    setForm({
      position: "",
      organization: "",
      startDate: "",
      endDate: "",
      description: "",
      isCurrent: false,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Agregar Experiencia
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar Experiencia Laboral</DialogTitle>
          <DialogDescription>
            Agrega una posicion laboral a tu trayectoria
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Cargo/Posicion</Label>
            <Input
              placeholder="Ej: Psicologa Clinica"
              value={form.position}
              onChange={(e) => setForm({ ...form, position: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Organizacion/Consultorio</Label>
            <Input
              placeholder="Ej: Hospital Italiano"
              value={form.organization}
              onChange={(e) => setForm({ ...form, organization: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fecha de Inicio</Label>
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Fecha de Fin</Label>
              <Input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                disabled={form.isCurrent}
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isCurrent"
              checked={form.isCurrent}
              onCheckedChange={(checked) =>
                setForm({ ...form, isCurrent: checked as boolean })
              }
            />
            <Label htmlFor="isCurrent">Trabajo actual</Label>
          </div>
          <div className="space-y-2">
            <Label>Descripcion (opcional)</Label>
            <Textarea
              placeholder="Describe tus responsabilidades..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !form.position || !form.startDate}
          >
            {isPending ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddLanguageDialog({
  open,
  onOpenChange,
  onAdd,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (lang: {
    language: string;
    proficiency: "native" | "fluent" | "conversational" | "basic";
  }) => void;
  isPending: boolean;
}) {
  const [form, setForm] = useState({
    language: "",
    proficiency: "fluent" as const,
  });

  const handleSubmit = () => {
    onAdd(form);
    setForm({ language: "", proficiency: "fluent" });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Agregar Idioma
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar Idioma</DialogTitle>
          <DialogDescription>
            Agrega un idioma en el que puedas atender
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Idioma</Label>
            <Input
              placeholder="Ej: Espanol"
              value={form.language}
              onChange={(e) => setForm({ ...form, language: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Nivel de Dominio</Label>
            <Select
              value={form.proficiency}
              onValueChange={(value) =>
                setForm({ ...form, proficiency: value as typeof form.proficiency })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PROFICIENCY_LEVELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || !form.language}>
            {isPending ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
