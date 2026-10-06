import { prisma } from "../lib/prisma";

export const searchInstitutions = async (
  query: string
) => {
  const institutions =
    await prisma.governmentInstitution.findMany({
      where: {
        name: {
          contains: query,
          mode: "insensitive",
        },
      },

      select: {
        id: true,
        aisheCode: true,
        name: true,
        state: true,
        district: true,
        website: true,
      },

      orderBy: {
        name: "asc",
      },

      take: 10,
    });

  return institutions;
};