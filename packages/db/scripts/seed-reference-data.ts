import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const therapeuticApproaches = [
  { name: 'Terapia Cognitivo-Conductual', acronym: 'TCC', description: 'Enfoque centrado en modificar pensamientos y comportamientos disfuncionales' },
  { name: 'Psicoanálisis', acronym: null, description: 'Exploración del inconsciente y experiencias tempranas' },
  { name: 'Terapia Humanista', acronym: null, description: 'Enfoque centrado en el crecimiento personal y la autorrealización' },
  { name: 'Terapia Gestalt', acronym: null, description: 'Enfoque en el aquí y ahora, la conciencia y la responsabilidad personal' },
  { name: 'Terapia Sistémica', acronym: null, description: 'Análisis de las relaciones y dinámicas familiares/sociales' },
  { name: 'EMDR', acronym: 'EMDR', description: 'Desensibilización y reprocesamiento por movimientos oculares' },
  { name: 'Mindfulness', acronym: null, description: 'Técnicas de atención plena y meditación' },
  { name: 'Terapia de Aceptación y Compromiso', acronym: 'ACT', description: 'Aceptación psicológica y compromiso con valores personales' },
  { name: 'Terapia Dialéctica Conductual', acronym: 'DBT', description: 'Combinación de técnicas cognitivo-conductuales y mindfulness' },
  { name: 'Terapia Breve', acronym: null, description: 'Intervenciones focalizadas de corta duración' },
  { name: 'Terapia Narrativa', acronym: null, description: 'Reconstrucción de la historia personal y significados' },
  { name: 'Psicología Positiva', acronym: null, description: 'Enfoque en fortalezas, bienestar y florecimiento' },
];

const specializations = [
  // Mental Health
  { name: 'Ansiedad', category: 'mental_health', description: 'Trastornos de ansiedad, fobias, ataques de pánico' },
  { name: 'Depresión', category: 'mental_health', description: 'Trastornos del estado de ánimo y depresión' },
  { name: 'Trauma y TEPT', category: 'mental_health', description: 'Trauma psicológico y estrés postraumático' },
  { name: 'TOC', category: 'mental_health', description: 'Trastorno obsesivo-compulsivo' },
  { name: 'Trastornos Alimentarios', category: 'mental_health', description: 'Anorexia, bulimia, atracones' },
  { name: 'Adicciones', category: 'mental_health', description: 'Dependencias a sustancias y comportamientos' },
  { name: 'Duelo y Pérdida', category: 'mental_health', description: 'Acompañamiento en procesos de duelo' },
  { name: 'Autoestima', category: 'mental_health', description: 'Desarrollo de autoconcepto y autoestima' },
  { name: 'Estrés Laboral', category: 'mental_health', description: 'Burnout y estrés relacionado con el trabajo' },

  // Age Groups
  { name: 'Niños', category: 'age_group', description: 'Psicoterapia infantil (0-12 años)' },
  { name: 'Adolescentes', category: 'age_group', description: 'Psicoterapia con adolescentes (13-18 años)' },
  { name: 'Adultos', category: 'age_group', description: 'Psicoterapia con adultos' },
  { name: 'Adultos Mayores', category: 'age_group', description: 'Psicogerontología y tercera edad' },

  // Modality
  { name: 'Terapia Individual', category: 'modality', description: 'Atención uno a uno' },
  { name: 'Terapia de Pareja', category: 'modality', description: 'Trabajo con parejas y relaciones' },
  { name: 'Terapia Familiar', category: 'modality', description: 'Intervención con sistemas familiares' },
  { name: 'Terapia Grupal', category: 'modality', description: 'Grupos terapéuticos' },
  { name: 'Terapia Online', category: 'modality', description: 'Atención por videollamada' },

  // Other
  { name: 'Orientación Vocacional', category: 'other', description: 'Elección de carrera y desarrollo profesional' },
  { name: 'Sexología', category: 'other', description: 'Terapia sexual y de género' },
  { name: 'Neuropsicología', category: 'other', description: 'Evaluación y rehabilitación neuropsicológica' },
  { name: 'Psicología Perinatal', category: 'other', description: 'Embarazo, parto y postparto' },
];

async function seed() {
  const client = await pool.connect();

  try {
    console.log('Seeding therapeutic approaches...');

    for (const approach of therapeuticApproaches) {
      await client.query(
        `INSERT INTO therapeutic_approaches (name, acronym, description)
         VALUES ($1, $2, $3)
         ON CONFLICT (name) DO NOTHING`,
        [approach.name, approach.acronym, approach.description]
      );
    }

    console.log(`✓ Inserted ${therapeuticApproaches.length} therapeutic approaches`);

    console.log('Seeding specializations...');

    for (const spec of specializations) {
      await client.query(
        `INSERT INTO specializations (name, category, description)
         VALUES ($1, $2, $3)
         ON CONFLICT (name) DO NOTHING`,
        [spec.name, spec.category, spec.description]
      );
    }

    console.log(`✓ Inserted ${specializations.length} specializations`);

    console.log('Seed completed successfully!');
  } catch (error) {
    console.error('Seed failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(console.error);
