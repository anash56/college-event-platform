import "dotenv/config";

const requiredEnv = (name: string): string => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

export const env = {
  PORT: Number(process.env.PORT) || 5000,

  DATABASE_URL: requiredEnv("DATABASE_URL"),
  JWT_SECRET: requiredEnv("JWT_SECRET"),

  BREVO_API_KEY: requiredEnv("BREVO_API_KEY"),
  BREVO_SENDER_EMAIL: requiredEnv("BREVO_SENDER_EMAIL"),
  BREVO_SENDER_NAME: requiredEnv("BREVO_SENDER_NAME")
};