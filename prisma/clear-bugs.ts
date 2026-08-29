import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Wiping all bug data for a clean slate...");
  
  // Wipe all bug-related data
  await prisma.auditLog.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.bugCC.deleteMany({});
  await prisma.flag.deleteMany({});
  await prisma.attachment.deleteMany({});
  await prisma.savedQuery.deleteMany({});
  await prisma.bug.deleteMany({});

  console.log("Done! You now have a completely empty dashboard.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
