import { prisma } from "./config/prisma.js";

async function testDb() {
  console.log("Testing database connection...");

  const users = await prisma.user.findMany();
  console.log("Users count:", users.length);

  const cabins = await prisma.cabin.findMany();
  console.log("Cabins count:", cabins.length);

  console.log("Database connected successfully");
}

testDb()
  .catch((error) => {
    console.error("Database test error:", error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });