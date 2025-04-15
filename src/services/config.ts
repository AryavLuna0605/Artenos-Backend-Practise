import dotenv from "dotenv"
import path, { dirname } from "path"
import z from "zod"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables from .env file, mainly for the development environment
dotenv.config({ path: path.join(__dirname, "../../.env_dev") })

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production"]),
  PORT: z.coerce.number(),
  DBHOST: z.string(),
  DBPORT: z.coerce.number(),
  DBUSER: z.string(),
  DBPASS: z.string(),
  DBNAME: z.string(),
  CORS_ALLOWED_ORIGIN: z.string(),
})

const env = envSchema.parse(process.env)

export default env
