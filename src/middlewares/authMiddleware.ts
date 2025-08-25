import Koa from "koa"
import env from "../services/config.js"
import { getDbClient, QUERIES } from "../services/db/client.js"
import jwt from "jsonwebtoken"

const db = getDbClient()
const jwtSecretKey = env.JWT_SECRET_KEY

export const authMiddleware: Koa.Middleware = async (ctx, next) => {
  const token = ctx.cookies.get("token");

  if (!token) {
    ctx.status = 401;
    ctx.body = {
      errCode: "TOKEN_MISSING",
      userMsg: "Token is invalid or expired",
    };
    return;
  }

  let payload: { id: string; email: string };
  try {
    payload = jwt.verify(token, jwtSecretKey) as { id: string; email: string };
  } catch (error) {
    ctx.status = 401;
    ctx.body = {
      errCode: "INVALID_TOKEN",
      userMsg: "Token is invalid or expired",
    };
    return;
  }

  const user = await db.execQuery(QUERIES.GET_USER_BY_EMAIL, [payload.email]);
  if (user.rows.length === 0) {
    ctx.status = 401;
    ctx.body = {
      errCode: "USER_NOT_FOUND",
      userMsg: "User does not exist",
    };
    return;
  }

  ctx.state.user = user.rows[0];
  await next();
};
