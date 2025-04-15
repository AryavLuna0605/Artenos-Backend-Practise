import Koa from "koa";
import logger from "../services/logger.js";

export const requestLogger: Koa.Middleware = async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  // TODO: See if this format needs to be changed
  logger.info(
    `${ctx.request.method} ${ctx.request.url} \n${ctx.response.status} ${JSON.stringify(ctx.response.body)} ${ms}ms`,
  );
};
