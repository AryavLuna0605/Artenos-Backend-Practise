import Koa from "koa";
import Router from "@koa/router";
import cors from "@koa/cors";
import { bodyParser } from "@koa/bodyparser";
import multer from "@koa/multer";
import path from "path";

import config from "./services/config.js";
import logger from "./services/logger.js";
import { getDbClient, QUERIES } from "./services/db/client.js";

import { apiConventions } from "./middlewares/apiConventions.js";
import { requestLogger } from "./middlewares/reqLogger.js";

import ROUTES from "./routes/index.js";

const rootPath = path.resolve(process.cwd());

// Note:
// This stores the files that are uploaded via the APIs to disk temporarily
// The other option is memory storage, which keeps the content of the files in memory
// Based on the requirements, we can switch the storage option.
// Disk storage will increase the latency, but is the more robust option to keep memory usage low, specially for large files
// If the "uploads" folder does not exist, it will be created automatically at the path provided
const diskStorage = multer.diskStorage({
  destination: path.join(rootPath, "uploads"),
});

const multipartBodyParser = multer({
  storage: diskStorage,
});

async function main() {
  logger.info("Connecting to database...");
  const dbClient = getDbClient({ logQueries: false });
  const res = await dbClient.execQuery(QUERIES.SELECT_NOW);
  logger.info("Connected to database at " + res.rows[0]["now"]);

  const app = new Koa();

  app.use(
    cors({
      allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      origin: config.CORS_ALLOWED_ORIGIN,
      credentials: true,
    }),
  );
  app.use(requestLogger);
  app.use(apiConventions);
  app.use(bodyParser({ enableTypes: ["json"] }));
  app.use(multipartBodyParser.any());
  app.use(ROUTES);

  logger.info("Starting server...");
  app.listen(config.PORT, () => {
    logger.info(`Server running on port ${config.PORT}`);
  });
}

await main();
