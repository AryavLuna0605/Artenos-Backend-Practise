import {
  RouteConf,
  endpt,
  group,
  GET,
  POST,
  createRouterFromConfig,
  middl,
} from "../apibase.js"
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { createUser, loginUser } from "./auth.js";
import { healthcheck } from "./health.js"
import { createProject } from "./project.js";

const ROUTE_CONF: RouteConf = group("/api", [
  endpt("/user/register", POST, createUser),
  endpt("/user/login", POST, loginUser),
  endpt("/health", GET, healthcheck),
  middl(authMiddleware),
  endpt("/project/create",POST, createProject)
])


export default createRouterFromConfig(ROUTE_CONF).routes()