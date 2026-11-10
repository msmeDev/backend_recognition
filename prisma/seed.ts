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
  { id: 3, fullName: 'Christianah Simeone' },
  { id: 4, fullName: 'David Adebayo' },
  { id: 5, fullName: 'Dinma Osiagwu' },
  { id: 6, fullName: 'Efe Okogbare' },
  { id: 7, fullName: 'Isreal Dadoneye' },
  { id: 8, fullName: 'Iyiola Olajide' },
  { id: 9, fullName: 'James Adeniyi' },
  { id: 10, fullName: 'Jamiu Alimi' },
  { id: 11, fullName: 'John Animasahun' },
  { id: 12, fullName: 'Jonathan Ochuko' },
  { id: 13, fullName: 'Joy Ajisefinni' },
  { id: 14, fullName: 'Yusuf Abdulsobur' },
  { id: 15, fullName: 'Kelvin Oke' },
  { id: 16, fullName: 'Kolapo Taofeeq' },
  { id: 17, fullName: 'kolawole Inioluwa' },
  { id: 18, fullName: 'Idiagbon Saadu Abdulrahman' },
  { id: 19, fullName: 'Boluwaji Ayobami' },
  { id: 20, fullName: 'Mohammed Kamaldeen Danladi' },
  { id: 21, fullName: 'Mayowa Oguntola' },
  { id: 22, fullName: 'Mustapha Suleiman' },
  { id: 23, fullName: 'Olamide Adeyemo' },
  { id: 24, fullName: 'Oluwakemi Animasahun' },
  { id: 25, fullName: 'Oluwatosin Ogunsan' },
  { id: 26, fullName: 'Omowunmi Oyinloye' },
  { id: 27, fullName: 'Oreva Aluta' },
  { id: 28, fullName: 'Sodiq Kamoru' },
  { id: 29, fullName: 'Taiwo Ibrahim' },
  { id: 30, fullName: 'Victor Olajide' },
  { id: 31, fullName: 'Shittu Nasir Oluwatoyin' },
  { id: 32, fullName: 'Agalabri Jerry' },
  { id: 33, fullName: 'Ebute Jackson' },
  { id: 34, fullName: 'Ridwan Abdulkadir' },
  { id: 35, fullName: 'Awoyinka Adenike Omolara' },
  { id: 36, fullName: 'Eze Shulamite' },
  { id: 37, fullName: 'Aquila Moses' },
  { id: 38, fullName: 'Isiah Johnson' },
];

// Can verify (staff_all_view) but are not nominee candidates.
const EXCLUDED_IDS = new Set([10, 23, 28]); // Jamiu Alimi, Olamide Adeyemo, Sodiq Kamoru

const MALE_NAMES = [
  'David Adebayo',
  'Efe Okogbare',
  'Isreal Dadoneye',
  'James Adeniyi',
  'John Animasahun',
  'Jonathan Ochuko',
  'Joy Ajisefinni',
  'Yusuf Abdulsobur',
  'Kelvin Oke',
  'Kolapo Taofeeq',
  'kolawole Inioluwa',
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
];

const FEMALE_NAMES = [
  'Bibiana Adaramola',
  'Boluwaji Esther Ojo',
  'Christianah Simeone',
  'Dinma Osiagwu',
  'Iyiola Olajide',
  'Oluwakemi Animasahun',
  'Omowunmi Oyinloye',
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
