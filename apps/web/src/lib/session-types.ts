/**
 * Tipos de sesión predefinidos para terapia psicológica
 * Basado en las modalidades y poblaciones más comunes en Argentina
 *
 * Referencias:
 * - Colegio de Psicólogos de Argentina
 * - Modalidades de psicoterapia según destinatarios
 */

export interface SessionTypeOption {
  id: string;
  name: string;
  category: SessionTypeCategory;
  description: string;
  defaultDurationMinutes: number;
}

export type SessionTypeCategory =
  | "individual"
  | "pareja"
  | "familia"
  | "grupo"
  | "evaluacion"
  | "especial";

export const SESSION_TYPE_CATEGORIES: Record<
  SessionTypeCategory,
  { label: string; description: string }
> = {
  individual: {
    label: "Terapia Individual",
    description: "Sesiones uno a uno con el paciente",
  },
  pareja: {
    label: "Terapia de Pareja",
    description: "Sesiones con ambos miembros de la pareja",
  },
  familia: {
    label: "Terapia Familiar",
    description: "Sesiones con el grupo familiar",
  },
  grupo: {
    label: "Terapia Grupal",
    description: "Sesiones con grupos de pacientes",
  },
  evaluacion: {
    label: "Evaluacion y Diagnostico",
    description: "Procesos de evaluacion psicologica",
  },
  especial: {
    label: "Servicios Especiales",
    description: "Otros servicios profesionales",
  },
};

export const PREDEFINED_SESSION_TYPES: SessionTypeOption[] = [
  // Terapia Individual
  {
    id: "individual-adulto",
    name: "Sesion Individual - Adulto",
    category: "individual",
    description: "Psicoterapia individual para adultos (18+ años)",
    defaultDurationMinutes: 50,
  },
  {
    id: "individual-adolescente",
    name: "Sesion Individual - Adolescente",
    category: "individual",
    description: "Psicoterapia individual para adolescentes (13-17 años)",
    defaultDurationMinutes: 50,
  },
  {
    id: "individual-nino",
    name: "Sesion Individual - Niño",
    category: "individual",
    description: "Psicoterapia individual para niños (hasta 12 años)",
    defaultDurationMinutes: 45,
  },
  {
    id: "individual-adulto-mayor",
    name: "Sesion Individual - Adulto Mayor",
    category: "individual",
    description: "Psicoterapia individual para adultos mayores (65+ años)",
    defaultDurationMinutes: 50,
  },

  // Terapia de Pareja
  {
    id: "pareja",
    name: "Terapia de Pareja",
    category: "pareja",
    description: "Sesion de psicoterapia para parejas",
    defaultDurationMinutes: 60,
  },
  {
    id: "pareja-prematrimonial",
    name: "Orientacion Prematrimonial",
    category: "pareja",
    description: "Orientacion y preparacion para parejas antes del matrimonio",
    defaultDurationMinutes: 60,
  },

  // Terapia Familiar
  {
    id: "familiar",
    name: "Terapia Familiar",
    category: "familia",
    description: "Sesion de psicoterapia con el grupo familiar",
    defaultDurationMinutes: 75,
  },
  {
    id: "familiar-orientacion-padres",
    name: "Orientacion a Padres",
    category: "familia",
    description: "Sesion de orientacion y guia parental",
    defaultDurationMinutes: 50,
  },

  // Terapia Grupal
  {
    id: "grupal-adultos",
    name: "Terapia Grupal - Adultos",
    category: "grupo",
    description: "Sesion de psicoterapia grupal para adultos",
    defaultDurationMinutes: 90,
  },
  {
    id: "grupal-adolescentes",
    name: "Terapia Grupal - Adolescentes",
    category: "grupo",
    description: "Sesion de psicoterapia grupal para adolescentes",
    defaultDurationMinutes: 90,
  },
  {
    id: "grupal-ninos",
    name: "Terapia Grupal - Niños",
    category: "grupo",
    description: "Sesion de psicoterapia grupal para niños",
    defaultDurationMinutes: 60,
  },

  // Evaluacion y Diagnostico
  {
    id: "primera-consulta",
    name: "Primera Consulta / Entrevista Inicial",
    category: "evaluacion",
    description: "Entrevista inicial de admision y evaluacion",
    defaultDurationMinutes: 60,
  },
  {
    id: "psicodiagnostico",
    name: "Psicodiagnostico",
    category: "evaluacion",
    description: "Proceso de evaluacion psicodiagnostica completa",
    defaultDurationMinutes: 90,
  },
  {
    id: "orientacion-vocacional",
    name: "Orientacion Vocacional",
    category: "evaluacion",
    description: "Proceso de orientacion vocacional y profesional",
    defaultDurationMinutes: 60,
  },
  {
    id: "evaluacion-neuropsicologica",
    name: "Evaluacion Neuropsicologica",
    category: "evaluacion",
    description: "Evaluacion de funciones cognitivas y neuropsicologicas",
    defaultDurationMinutes: 90,
  },

  // Servicios Especiales
  {
    id: "sesion-online",
    name: "Sesion Online",
    category: "especial",
    description: "Sesion de psicoterapia por videollamada",
    defaultDurationMinutes: 50,
  },
  {
    id: "sesion-domicilio",
    name: "Sesion a Domicilio",
    category: "especial",
    description: "Sesion de psicoterapia en el domicilio del paciente",
    defaultDurationMinutes: 60,
  },
  {
    id: "interconsulta",
    name: "Interconsulta",
    category: "especial",
    description: "Consulta con otros profesionales de la salud",
    defaultDurationMinutes: 30,
  },
  {
    id: "supervision-clinica",
    name: "Supervision Clinica",
    category: "especial",
    description: "Supervision de casos clinicos para profesionales",
    defaultDurationMinutes: 60,
  },
  {
    id: "informe-psicologico",
    name: "Informe Psicologico",
    category: "especial",
    description: "Elaboracion de informe psicologico escrito",
    defaultDurationMinutes: 0, // No tiene duracion de sesion
  },
];

// Agrupar por categoria para facilitar la visualizacion
export function getSessionTypesByCategory(): Record<
  SessionTypeCategory,
  SessionTypeOption[]
> {
  return PREDEFINED_SESSION_TYPES.reduce(
    (acc, type) => {
      if (!acc[type.category]) {
        acc[type.category] = [];
      }
      acc[type.category].push(type);
      return acc;
    },
    {} as Record<SessionTypeCategory, SessionTypeOption[]>
  );
}

// Buscar un tipo de sesion por ID
export function getSessionTypeById(id: string): SessionTypeOption | undefined {
  return PREDEFINED_SESSION_TYPES.find((type) => type.id === id);
}
