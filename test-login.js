const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

async function main() {
  const prisma = new PrismaClient()
  const user = await prisma.user.findUnique({
    where: { username: 'procurement' }
  })
  
  if (!user) {
    console.log("User not found!")
    return
  }

  console.log("User found:", user.username)
  
  const isMatch = await bcrypt.compare('password123', user.password)
  console.log("Password matches 'password123'? ", isMatch)
}

main()
  .catch(console.error)
  .finally(() => process.exit(0))
