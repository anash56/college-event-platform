import { prisma } from "../lib/prisma";

async function main() {
  console.log("Checking GovernmentInstitution database...\n");

  // -------------------------
  // 1. Count institutions
  // -------------------------

  const totalInstitutions =
    await prisma.governmentInstitution.count();

  console.log(
    "Total institutions in database:",
    totalInstitutions
  );

  if (totalInstitutions !== 442) {
    throw new Error(
      `Expected 442 institutions, but found ${totalInstitutions}`
    );
  }

  console.log("✓ Record count is correct\n");

  // -------------------------
  // 2. Find L.D. College
  // -------------------------

  const ldColleges =
    await prisma.governmentInstitution.findMany({
      where: {
        name: {
          contains: "L.D.",
          mode: "insensitive",
        },
      },

      orderBy: {
        name: "asc",
      },
    });

  console.log("L.D. College search results:");

  for (const college of ldColleges) {
    console.log({
      id: college.id,
      aisheCode: college.aisheCode,
      name: college.name,
      state: college.state,
      district: college.district,
      website: college.website,
    });
  }

  // -------------------------
  // 3. Find exact AISHE code
  // -------------------------

  const ldce =
    await prisma.governmentInstitution.findUnique({
      where: {
        aisheCode: "C-212",
      },
    });

  console.log("\nAISHE C-212:");

  console.log(ldce);

  // -------------------------
  // 4. Disconnect
  // -------------------------

  await prisma.$disconnect();

  console.log("\nDatabase verification completed.");
}

main().catch(async (error) => {
  console.error(
    "\nDatabase verification failed:"
  );

  console.error(error);

  await prisma.$disconnect();

  process.exit(1);
});