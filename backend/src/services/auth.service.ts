import { prisma } from "../lib/prisma";
import { hashPassword } from "../utils/password";
import { UserRole } from "../../generated/prisma/enums";
import { comparePassword } from "../utils/password";
import { generateToken } from "../utils/jwt";
import { createOrRefreshEmailVerification } from "./email-verification.service";

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  collegeId?: string;
}

export const registerUser = async (input: RegisterInput) => {
  const existingUser = await prisma.user.findUnique({
    where: {
      email: input.email
    }
  });

  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
  data: {
    name: input.name,
    email: input.email,
    passwordHash,
    role: UserRole.STUDENT,
    ...(input.collegeId !== undefined && {
      collegeId: input.collegeId
    })
  },
  select: {
    id: true,
    name: true,
    email: true,
    role: true,
    collegeId: true,
    emailVerified: true,
    createdAt: true
  }
});

await createOrRefreshEmailVerification(
  user.id,
  user.email
);

return user;
};

export const loginUser = async (
  email: string,
  password: string
) => {
  const user = await prisma.user.findUnique({
    where: {
      email
    },
    select: {
      id: true,
      name: true,
      email: true,
      passwordHash: true,
      role: true,
      collegeId: true,
      emailVerified: true
    }
  });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const isPasswordValid = await comparePassword(
    password,
    user.passwordHash
  );

  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  const token = generateToken({
    userId: user.id,
    role: user.role
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      collegeId: user.collegeId,
      emailVerified: user.emailVerified
    },
    token
  };
};

export const getCurrentUser = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      collegeId: true,
      emailVerified: true,
      createdAt: true
    }
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

