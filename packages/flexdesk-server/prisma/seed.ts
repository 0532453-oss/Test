import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const RESOURCES = [
  'jobs',
  'customers',
  'invoices',
  'estimates',
  'technicians',
  'properties',
  'parts',
  'reports',
  'settings',
  'roles',
  'workspace',
] as const;

const ACTIONS = [
  'create',
  'read',
  'update',
  'delete',
  'manage',
  'assign',
] as const;

async function seed() {
  console.log('Seeding permissions...');

  let created = 0;
  let existed = 0;

  for (const resource of RESOURCES) {
    for (const action of ACTIONS) {
      const existing = await prisma.permission.findUnique({
        where: { resource_action: { resource, action } },
      });

      if (existing) {
        existed++;
      } else {
        await prisma.permission.create({
          data: {
            resource,
            action,
            description: `${action} ${resource}`,
          },
        });
        created++;
      }
    }
  }

  const total = RESOURCES.length * ACTIONS.length;
  console.log(`Seed complete: ${created} permissions created, ${existed} already existed (${total} total).`);
}

seed()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
