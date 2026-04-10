const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  
  // Seed System Admin
  await prisma.user.upsert({
    where: { email: 'admin@trustvibe.com' },
    update: {},
    create: {
      name: 'System Administrator',
      email: 'admin@trustvibe.com',
      password: adminPassword,
      address: 'Admin HQ',
      role: 'SYSTEM_ADMIN'
    }
  });

  // Seed a sample Store
  const storePassword = await bcrypt.hash('Secret@123', 10);
  await prisma.user.upsert({
    where: { email: 'store@example.com' },
    update: {},
    create: {
      name: 'Best Electronics Store',
      email: 'store@example.com',
      password: storePassword,
      address: '123 Fake Street, CA',
      role: 'STORE_OWNER'
    }
  });
  
  const storePassword2 = await bcrypt.hash('Secret@123', 10);
  await prisma.user.upsert({
    where: { email: 'grocery@example.com' },
    update: {},
    create: {
      name: 'Local Fresh Grocery',
      email: 'grocery@example.com',
      password: storePassword2,
      address: '456 Central Ave, NY',
      role: 'STORE_OWNER'
    }
  });

  console.log('Seed completed with Stores.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
