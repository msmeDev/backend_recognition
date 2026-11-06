import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clear in dependency order (nominations first, then staff tables)
  await prisma.nomination.deleteMany();
  await prisma.staffAll.deleteMany();
  await prisma.staffMale.deleteMany();
  await prisma.staffFemale.deleteMany();

  // ── Male staff ────────────────────────────────────────────────────────────
  await prisma.staffMale.createMany({
    data: [
      { fullName: 'James Okonkwo' },
      { fullName: 'David Adeyemi' },
      { fullName: 'Emmanuel Chukwu' },
      { fullName: 'Samuel Nwosu' },
      { fullName: 'Michael Eze' },
      { fullName: 'Victor Okafor' },
    ],
  });

  // ── Female staff ──────────────────────────────────────────────────────────
  await prisma.staffFemale.createMany({
    data: [
      { fullName: 'Grace Abiodun' },
      { fullName: 'Blessing Okoye' },
      { fullName: 'Faith Nwachukwu' },
      { fullName: 'Chiamaka Nnaji' },
      { fullName: 'Jennifer Adaeze' },
      { fullName: 'Priscilla Ugwu' },
    ],
  });

  // ── All staff (males first → IDs 1-6, females → IDs 7-12) ────────────────
  // The order matches staff_male and staff_female so full_name comparisons
  // in the cross-table duplicate check work correctly.
  await prisma.staffAll.createMany({
    data: [
      { fullName: 'James Okonkwo' },
      { fullName: 'David Adeyemi' },
      { fullName: 'Emmanuel Chukwu' },
      { fullName: 'Samuel Nwosu' },
      { fullName: 'Michael Eze' },
      { fullName: 'Victor Okafor' },
      { fullName: 'Grace Abiodun' },
      { fullName: 'Blessing Okoye' },
      { fullName: 'Faith Nwachukwu' },
      { fullName: 'Chiamaka Nnaji' },
      { fullName: 'Jennifer Adaeze' },
      { fullName: 'Priscilla Ugwu' },
    ],
  });

  console.log('✓ Seed completed: 6 male, 6 female, 12 staff_all records inserted.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
