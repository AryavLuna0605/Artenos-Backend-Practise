import {
  RouteConf,
  endpt,
  group,
  GET,
  POST,
  createRouterFromConfig,
  middl,
  DELETE,
  PATCH,
} from "../apibase.js"
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { createUser, loginUser } from "./auth.js";
import { healthcheck } from "./health.js"
import { createProject, deleteProject, getProjects, updateProjectName } from "./project.js";

const ROUTE_CONF: RouteConf = group("/api", [
  endpt("/health", GET, healthcheck),
  endpt("/user/register", POST, createUser),
  endpt("/user/login", POST, loginUser),
  middl(authMiddleware),
  endpt("/project", GET, getProjects),
  endpt("/project/create",POST, createProject),
  endpt("/project/:id", DELETE, deleteProject),
  endpt("/project/:id",PATCH, updateProjectName),
])


export default createRouterFromConfig(ROUTE_CONF).routes()