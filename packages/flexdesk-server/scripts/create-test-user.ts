import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createTestUser() {
  const email = 'janedoe@acme.com';
  const password = 'password';
  const firstName = 'Jane';
  const lastName = 'Doe';

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log(`User ${email} already exists!`);
      return;
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create workspace
    const workspace = await prisma.workspace.create({
      data: {
        name: `${firstName}'s Workspace`,
        subdomain: `jane-${Date.now()}`,
      },
    });

    // Create user with workspace
    const user = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        passwordHash,
        authProvider: 'email',
        workspaces: {
          create: {
            workspaceId: workspace.id,
            role: 'OWNER',
          },
        },
      },
    });

    console.log('✅ Test user created successfully!');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Workspace: ${workspace.name}`);
    console.log(`   User ID: ${user.id}`);
  } catch (error) {
    console.error('❌ Error creating test user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
