import { PrismaClient, UserTier } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123!', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'contact-yttr@angellabs.xyz' },
    update: {},
    create: {
      email: 'contact-yttr@angellabs.xyz',
      name: 'Admin User',
      passwordHash: adminPassword,
      emailVerified: new Date(),
      isAdmin: true,
      tier: UserTier.TIER3,
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // Create test users for each tier
  const testUsers = [
    { email: 'free@test.com', name: 'Free User', tier: UserTier.FREE },
    { email: 'tier1@test.com', name: 'Tier 1 User', tier: UserTier.TIER1 },
    { email: 'tier2@test.com', name: 'Tier 2 User', tier: UserTier.TIER2 },
    { email: 'tier3@test.com', name: 'Tier 3 User', tier: UserTier.TIER3 },
  ];

  for (const userData of testUsers) {
    const password = await bcrypt.hash('test123!', 12);
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        ...userData,
        passwordHash: password,
        emailVerified: new Date(),
      },
    });
    console.log(`✅ Test user created: ${user.email} (${user.tier})`);
  }

  // Create default system configurations
  const configs = [
    {
      key: 'rate_limits',
      value: {
        anonymous: 10,
        free: 30,
        tier1: 120,
        tier2: 340,
        tier3: 500,
      },
    },
    {
      key: 'video_limits',
      value: {
        free: 50,
        tier1: 100,
        tier2: 250,
        tier3: 500,
      },
    },
    {
      key: 'batch_limits',
      value: {
        free: 50,
        tier1: 100,
        tier2: 500,
        tier3: 1000,
      },
    },
    {
      key: 'feature_flags',
      value: {
        maintenance_mode: false,
        signup_enabled: true,
        api_keys_enabled: true,
        playlist_search: true,
      },
    },
  ];

  for (const config of configs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: { value: config.value },
      create: config,
    });
    console.log(`✅ Config created: ${config.key}`);
  }

  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
