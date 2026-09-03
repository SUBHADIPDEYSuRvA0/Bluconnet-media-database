import { PrismaClient, Role, Status } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function createAdminUser(email: string, password: string, name: string = 'Super Admin') {
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const user = await prisma.user.upsert({
    where: { email },
    update: { 
      passwordHash: hashedPassword,
      role: Role.SUPER_ADMIN,
      status: Status.ACTIVE,
      name,
    },
    create: {
      email,
      passwordHash: hashedPassword,
      role: Role.SUPER_ADMIN,
      status: Status.ACTIVE,
      name,
    },
  });
  
  await prisma.$disconnect();
  return { success: true, message: 'Admin user created/updated', email: user.email };
}
