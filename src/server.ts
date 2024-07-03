import Koa from "koa"
import Router from "@koa/router"
import cors from "@koa/cors"
import { bodyParser } from "@koa/bodyparser"

import config from "./services/config.js"
import logger from "./services/logger.js"
import { getDbClient, QUERIES } from "./services/db/client.js"

import { apiConventions } from "./middlewares/apiConventions.js"
import { requestLogger } from "./middlewares/reqLogger.js"

import ROUTES from "./routes/index.js"

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

  app.use(ROUTES)

  logger.info("Starting server...")
  app.listen(config.PORT, () => {
    logger.info(`Server running on port ${config.PORT}`)
  })
}

await main()
