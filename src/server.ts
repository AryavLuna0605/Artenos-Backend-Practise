import { bodyParser } from "@koa/bodyparser"
import cors from "@koa/cors"
import multer from "@koa/multer"
import Koa from "koa"

import { apiConventions } from "./middlewares/apiConventions.js" //(custom API rules, likely error handling or response formatting)
import { requestLogger } from "./middlewares/reqLogger.js" //(logs requests for monitoring/debugging)
import config from "./services/config.js"
import { getDbClient, QUERIES } from "./services/db/client.js" // database logic
import logger from "./services/logger.js"

import ROUTES from "./routes/index.js"

async function main() {
  logger.info("Connecting to database...")
  const dbClient = getDbClient({ logQueries: false })
  const res = await dbClient.execQuery(QUERIES.SELECT_NOW) //test query (SELECT_NOW) to ensure DB is available
  logger.info("Connected to database at " + res.rows[0]["now"])

  const app = new Koa() // creating koa app instance

  app.use(
    cors({
      allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      origin: config.CORS_ALLOWED_ORIGIN,
      credentials: true,
    }),
  )
  app.use(requestLogger) 
  app.use(apiConventions) //Ensures responses are formatted consistently (likely handles errors, wraps responses, etc.)
  app.use(bodyParser({ enableTypes: ["json"] }))
  app.use(multer().any())
  app.use(ROUTES)

  logger.info("Starting server...")
  app.listen(config.PORT, () => {
    logger.info(`Server running on port ${config.PORT}`)
  })
}

await main()
