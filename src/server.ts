import { bodyParser } from "@koa/bodyparser"
import cors from "@koa/cors"
import multer from "@koa/multer"
import Koa from "koa"

import { apiConventions } from "./middlewares/apiConventions.js"
import { requestLogger } from "./middlewares/reqLogger.js"
import config from "./services/config.js"
import { getDbClient, QUERIES } from "./services/db/client.js"
import logger from "./services/logger.js"

import ROUTES from "./routes/index.js"

const multipartBodyParser = multer().any()

async function main() {
  logger.info("Connecting to database...")
  const dbClient = getDbClient({ logQueries: false })
  const res = await dbClient.execQuery(QUERIES.SELECT_NOW)
  logger.info("Connected to database at " + res.rows[0]["now"])

  const app = new Koa()

  app.use(
    cors({
      allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      origin: config.CORS_ALLOWED_ORIGIN,
      credentials: true,
    }),
  )
  app.use(requestLogger)
  app.use(apiConventions)
  app.use(bodyParser({ enableTypes: ["json"] }))
  app.use(multipartBodyParser)
  app.use(ROUTES)

  logger.info("Starting server...")
  app.listen(config.PORT, () => {
    logger.info(`Server running on port ${config.PORT}`)
  })
}

await main()
