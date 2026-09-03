import { PrismaClient, Role, Status, LeadQuality } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function seedDatabase() {
  const hashedPassword = await bcrypt.hash('Admin@1234', 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@bluconnetmedia.com' },
    update: { passwordHash: hashedPassword },
    create: { name: 'Super Admin', email: 'admin@bluconnetmedia.com', passwordHash: hashedPassword, role: Role.SUPER_ADMIN },
  });

  const employee = await prisma.user.upsert({
    where: { email: 'rahul@bluconnetmedis.com' },
    update: { passwordHash: hashedPassword },
    create: { name: 'Rahul Sharma', email: 'rahul@bluconnetmedis.com', passwordHash: hashedPassword, role: Role.EMPLOYEE },
  });

  const companies = [
    { companyName: 'TechSolutions Inc', industry: 'SaaS', country: 'USA', city: 'San Francisco', leadQuality: LeadQuality.A, status: Status.ACTIVE, email: 'contact@techsolutions.com', addedById: superAdmin.id, lastModifiedById: superAdmin.id },
    { companyName: 'HealthCare Global', industry: 'Healthcare', country: 'India', city: 'Mumbai', leadQuality: LeadQuality.B, status: Status.PENDING, email: 'info@healthcare.in', addedById: employee.id, lastModifiedById: employee.id },
  ];

  for (const comp of companies) {
    const found = await prisma.company.findFirst({ where: { email: comp.email } });
    if (!found) {
      await prisma.company.create({ data: comp as any });
    }
  }

  await prisma.$disconnect();
  return { success: true, message: 'Database seeded successfully' };
}
