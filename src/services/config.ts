import dotenv from "dotenv"
import z from "zod"

dotenv.config()

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production"]),
  PORT: z.coerce.number(),
  DBHOST: z.string(),
  DBPORT: z.coerce.number(),
  DBUSER: z.string(),
  DBPASS: z.string(),
  DBNAME: z.string(),
  CORS_ALLOWED_ORIGIN: z.string(),
  JWT_SECRET_KEY: z.string(),
})

const env = envSchema.parse(process.env)

export default env
