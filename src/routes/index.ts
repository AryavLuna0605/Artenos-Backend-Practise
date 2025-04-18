import {
  RouteConf,
  endpt,
  group,
  GET,
  POST,
  createRouterFromConfig,
} from "../apibase.js"

import { healthcheck } from "./health.js"

const ROUTE_CONF: RouteConf = group("/api", [
  endpt("/health", GET, healthcheck),
])

export default createRouterFromConfig(ROUTE_CONF).routes()
