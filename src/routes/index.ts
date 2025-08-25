import {
  RouteConf,
  endpt,
  group,
  GET,
  POST,
  createRouterFromConfig,
} from "../apibase.js"
import { createUser, loginUser } from "./auth.js";
import { healthcheck } from "./health.js"

const ROUTE_CONF: RouteConf = group("/api", [
  endpt("/health", GET, healthcheck),
  endpt("/user/register", POST, createUser),
  endpt("/user/login", POST, loginUser)
])

export default createRouterFromConfig(ROUTE_CONF).routes()