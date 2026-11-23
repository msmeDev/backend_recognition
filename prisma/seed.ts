import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Master staff list (38). The number is the row's id in staff_all_view, and
// the same id is reused in staff_all, so the id returned by POST /api/verify
// (which reads staff_all_view) points to the same person in staff_all.
// ---------------------------------------------------------------------------
const ALL_STAFF: { id: number; fullName: string }[] = [
  { id: 1, fullName: 'Bibiana Adaramola' },
  { id: 2, fullName: 'Boluwaji Esther Ojo' },
  { id: 3, fullName: 'Christianah Simeon' },
  { id: 4, fullName: 'David Adebayo' },
  { id: 5, fullName: 'Chidinma Osuagwu' },
  { id: 6, fullName: 'Efe Okogbare' },
  { id: 7, fullName: 'Israel Dadoneye' },
  { id: 8, fullName: 'Iyiola Olajide' },
  { id: 9, fullName: 'James Adeniyi' },
  { id: 10, fullName: 'Jamiu Alimi' },
  { id: 11, fullName: 'John Animasahun' },
  { id: 12, fullName: 'Jonathan Ochuko' },
  { id: 13, fullName: 'Joy Ajisefinni' },
  { id: 14, fullName: 'Yusuf Abdulsobur' },
  { id: 15, fullName: 'Ayoola Olalekan' },
  { id: 16, fullName: 'Kelvin Oke' },
  { id: 17, fullName: 'Kolapo Taofeeq' },
  { id: 18, fullName: 'Kolawole Inioluwa' },
  { id: 19, fullName: 'Idiagbon Saadu Abdulrahman' },
  { id: 20, fullName: 'Boluwaji Ayobami' },
  { id: 21, fullName: 'Mohammed Kamaldeen Danladi' },
  { id: 22, fullName: 'Mayowa Oguntola' },
  { id: 23, fullName: 'Mustapha Suleiman' },
  { id: 24, fullName: 'Olamide Adeyemo' },
  { id: 25, fullName: 'Oluwakemi Animasahun' },
  { id: 26, fullName: 'Oluwatosin Ogunsan' },
  { id: 27, fullName: 'Omowumi Oyinloye' },
  { id: 28, fullName: 'Oreva Aluta' },
  { id: 29, fullName: 'Sodiq Kamoru' },
  { id: 30, fullName: 'Taiwo Ibrahim' },
  { id: 31, fullName: 'Victor Olajide' },
  { id: 32, fullName: 'Shittu Nasir Oluwatoyin' },
  { id: 33, fullName: 'Agalabri Jerry' },
  { id: 34, fullName: 'Ebute Jackson' },
  { id: 35, fullName: 'Ridwan Abdulkadir' },
  { id: 36, fullName: 'Awoyinka Adenike Omolara' },
  { id: 37, fullName: 'Eze Shulamite' },
  { id: 38, fullName: 'Aquila Moses' },
  { id: 39, fullName: 'Isiah Johnson' },
  { id: 40, fullName: 'Abdulbassit Abdullahi' },
];

// Can verify (staff_all_view) but are not nominee candidates.
const EXCLUDED_IDS = new Set([10, 24, 29 ]); // Jamiu Alimi, Olamide Adeyemo, Sodiq Kamoru

const MALE_NAMES = [
  'David Adebayo',
  'Efe Okogbare',
  'Israel Dadoneye',
  'James Adeniyi',
  'John Animasahun',
  'Jonathan Ochuko',
  'Joy Ajisefinni',
  'Yusuf Abdulsobur',
  'Ayoola Olalekan',
  'Kelvin Oke',
  'Kolapo Taofeeq',
  'Kolawole Inioluwa',
  'Idiagbon Saadu Abdulrahman',
  'Boluwaji Ayobami',
  'Mohammed Kamaldeen Danladi',
  'Mayowa Oguntola',
  'Mustapha Suleiman',
  'Oluwatosin Ogunsan',
  'Taiwo Ibrahim',
  'Victor Olajide',
  'Shittu Nasir Oluwatoyin',
  'Agalabri Jerry',
  'Ebute Jackson',
  'Ridwan Abdulkadir',
  'Aquila Moses',
  'Isiah Johnson',
  'Abdulbassit Abdullahi'
];

const FEMALE_NAMES = [
  'Bibiana Adaramola',
  'Boluwaji Esther Ojo',
  'Christianah Simeon',
  'Chidinma Osuagwu',
  'Iyiola Olajide',
  'Oluwakemi Animasahun',
  'Omowumi Oyinloye',
  'Oreva Aluta',
  'Awoyinka Adenike Omolara',
  'Eze Shulamite',
];

// Fail fast if the male/female lists don't split staff_all exactly.
function assertPartition(nominees: string[]) {
  const nomineeSet = new Set(nominees);
  const genderNames = [...MALE_NAMES, ...FEMALE_NAMES];
  const genderSet = new Set(genderNames);

  const problems: string[] = [];
  if (genderSet.size !== genderNames.length) problems.push('a name appears in both or twice in the male/female lists');
  const missing = nominees.filter(n => !genderSet.has(n));
  const unknown = genderNames.filter(n => !nomineeSet.has(n));
  if (missing.length) problems.push(`no gender assigned: ${missing.join(', ')}`);
  if (unknown.length) problems.push(`not in staff_all: ${unknown.join(', ')}`);

  if (problems.length) {
    throw new Error(`Staff list mismatch:\n  - ${problems.join('\n  - ')}`);
  }
}

// Explicit ids don't advance Postgres sequences; bump them so later inserts don't collide.
async function resetSequence(table: string) {
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), COALESCE((SELECT MAX(id) FROM "${table}"), 0) + 1, false)`,
  );
}

async function main() {
  const nominees = ALL_STAFF.filter(s => !EXCLUDED_IDS.has(s.id));
  assertPartition(nominees.map(s => s.fullName));

  // Clear in dependency order (nominations first, then staff tables)
  await prisma.nomination.deleteMany();
  await prisma.staffAll.deleteMany();
  await prisma.staffMale.deleteMany();
  await prisma.staffFemale.deleteMany();
  await prisma.staffAllView.deleteMany();

  // ── Step 2a: staff_all_view — all 38 (verification) ──────────────────────
  const now = new Date();
  await prisma.staffAllView.createMany({
    data: ALL_STAFF.map(s => ({ id: s.id, fullName: s.fullName, createdAt: now })),
  });

  // ── Step 2b: staff_all — 35 nominees, same ids as staff_all_view ─────────
  await prisma.staffAll.createMany({
    data: nominees.map(s => ({ id: s.id, fullName: s.fullName })),
  });

  // ── Step 2b: staff_male / staff_female ───────────────────────────────────
  await prisma.staffMale.createMany({ data: MALE_NAMES.map(fullName => ({ fullName })) });
  await prisma.staffFemale.createMany({ data: FEMALE_NAMES.map(fullName => ({ fullName })) });

  await resetSequence('staff_all_view');
  await resetSequence('staff_all');

  console.log(
    `✓ Seed completed: ${ALL_STAFF.length} staff_all_view, ${nominees.length} staff_all, ` +
      `${MALE_NAMES.length} staff_male, ${FEMALE_NAMES.length} staff_female.`,
  );
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
