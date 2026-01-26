import { createDb, closePool, therapeuticApproaches, specializations } from "@psico-pay/db";

const THERAPEUTIC_APPROACHES = [
  { name: "Terapia Cognitivo-Conductual", acronym: "TCC", description: "Enfoque que trabaja sobre pensamientos y comportamientos para modificar patrones disfuncionales" },
  { name: "Psicoanálisis", acronym: "PA", description: "Exploración del inconsciente y experiencias tempranas para comprender conflictos actuales" },
  { name: "Terapia Gestalt", acronym: "TG", description: "Enfoque centrado en el presente y la toma de conciencia de la experiencia actual" },
  { name: "Terapia Humanista", acronym: "TH", description: "Enfoque centrado en la persona, su potencial de crecimiento y autorrealización" },
  { name: "Terapia Sistémica", acronym: "TS", description: "Trabajo con sistemas familiares y relacionales para comprender dinámicas interpersonales" },
  { name: "Terapia Dialéctico-Conductual", acronym: "TDC", description: "Combina técnicas cognitivo-conductuales con mindfulness y regulación emocional" },
  { name: "EMDR", acronym: "EMDR", description: "Desensibilización y reprocesamiento por movimientos oculares para trauma" },
  { name: "Terapia de Aceptación y Compromiso", acronym: "ACT", description: "Enfoque que promueve la aceptación y el compromiso con valores personales" },
  { name: "Terapia Breve Estratégica", acronym: "TBE", description: "Intervenciones focalizadas en soluciones y cambios rápidos" },
  { name: "Mindfulness", acronym: "MF", description: "Práctica de atención plena aplicada al bienestar psicológico" },
  { name: "Terapia Narrativa", acronym: "TN", description: "Exploración y reescritura de historias personales para generar cambio" },
  { name: "Logoterapia", acronym: "LT", description: "Búsqueda de sentido y propósito como motor del bienestar" },
];

const SPECIALIZATIONS = [
  // Mental health conditions
  { name: "Ansiedad", category: "mental_health" as const, description: "Trastornos de ansiedad, pánico, fobias" },
  { name: "Depresión", category: "mental_health" as const, description: "Trastornos depresivos y del estado de ánimo" },
  { name: "Trauma y TEPT", category: "mental_health" as const, description: "Estrés postraumático y trauma complejo" },
  { name: "TOC", category: "mental_health" as const, description: "Trastorno obsesivo-compulsivo" },
  { name: "Trastornos Alimentarios", category: "mental_health" as const, description: "Anorexia, bulimia, trastorno por atracón" },
  { name: "Adicciones", category: "mental_health" as const, description: "Dependencia de sustancias y adicciones comportamentales" },
  { name: "Trastornos de Personalidad", category: "mental_health" as const, description: "Trastorno límite, narcisista, etc." },
  { name: "Duelo", category: "mental_health" as const, description: "Procesos de pérdida y elaboración del duelo" },
  { name: "Estrés", category: "mental_health" as const, description: "Manejo del estrés y burnout" },
  { name: "Autoestima", category: "mental_health" as const, description: "Trabajo con la autoimagen y autoconcepto" },

  // Age groups
  { name: "Niños", category: "age_group" as const, description: "Psicoterapia infantil (0-12 años)" },
  { name: "Adolescentes", category: "age_group" as const, description: "Trabajo con adolescentes (13-18 años)" },
  { name: "Adultos", category: "age_group" as const, description: "Psicoterapia para adultos" },
  { name: "Adultos Mayores", category: "age_group" as const, description: "Psicogerontología y tercera edad" },

  // Modalities
  { name: "Terapia de Pareja", category: "modality" as const, description: "Trabajo con parejas y relaciones" },
  { name: "Terapia Familiar", category: "modality" as const, description: "Intervención con sistemas familiares" },
  { name: "Terapia Grupal", category: "modality" as const, description: "Procesos terapéuticos grupales" },
  { name: "Terapia Online", category: "modality" as const, description: "Atención psicológica a distancia" },

  // Other specializations
  { name: "Sexualidad", category: "other" as const, description: "Terapia sexual y de género" },
  { name: "Violencia de Género", category: "other" as const, description: "Atención a víctimas de violencia" },
  { name: "Orientación Vocacional", category: "other" as const, description: "Elección de carrera y desarrollo profesional" },
  { name: "Neurodiversidad", category: "other" as const, description: "TDAH, autismo, altas capacidades" },
  { name: "Perinatalidad", category: "other" as const, description: "Embarazo, parto, posparto y crianza" },
];

async function seedReferenceData() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("Error: DATABASE_URL environment variable is not set");
    process.exit(1);
  }

  const db = createDb(connectionString);

  try {
    console.log("Seeding therapeutic approaches...");

    for (const approach of THERAPEUTIC_APPROACHES) {
      await db
        .insert(therapeuticApproaches)
        .values(approach)
        .onConflictDoNothing();
    }

    console.log(`  Inserted ${THERAPEUTIC_APPROACHES.length} therapeutic approaches`);

    console.log("Seeding specializations...");

    for (const spec of SPECIALIZATIONS) {
      await db
        .insert(specializations)
        .values(spec)
        .onConflictDoNothing();
    }

    console.log(`  Inserted ${SPECIALIZATIONS.length} specializations`);

    console.log("\nReference data seeded successfully!");
  } catch (error) {
    console.error("Error seeding reference data:", error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

seedReferenceData();
