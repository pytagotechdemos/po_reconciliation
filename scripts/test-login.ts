import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  const user = await prisma.user.findUnique({ where: { username: 'owner' } });
  if (!user) {
    console.log("No owner user found");
    return;
  }
  const match = await bcrypt.compare('password123', user.password);
  console.log("Owner found, password match:", match);
}
main().catch(console.error);
