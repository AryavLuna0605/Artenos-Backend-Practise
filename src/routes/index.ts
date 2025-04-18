import {
  RouteConf,
  endpt,
  group,
  GET,
  POST,
  createRouterFromConfig,
} from "../apibase.js"

import { foo, healthcheck } from "./health.js"

const ROUTE_CONF: RouteConf = group("/api", [
  endpt("/health", GET, healthcheck),
  endpt("/foo", POST, foo),
])

export default createRouterFromConfig(ROUTE_CONF).routes()
