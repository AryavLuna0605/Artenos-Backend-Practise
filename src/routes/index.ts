import Koa from "koa";
import Router from "@koa/router";

import { handlerToKoaMiddleware, APIHandler } from "../apibase.js";

import { healthcheck } from "./health.js";

const GET = "GET";
const POST = "POST";
const PUT = "PUT";
const DELETE = "DELETE";
const PATCH = "PATCH";

type Method = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

type Endpt = {
  type: "endpt";
  method: Method;
  path: string;
  handler: APIHandler<any, any, any, any>;
};

type Middle = {
  type: "middl";
  middleware: Koa.Middleware[];
};

type Group = {
  type: "group";
  path: string;
  children: (Endpt | Middle | Group)[];
};

function endpt(
  path: string,
  method: Method,
  handler: APIHandler<any, any, any, any>,
): Endpt {
  return { type: "endpt", method, path, handler };
}

function middl(...middleware: Koa.Middleware[]): Middle {
  return { type: "middl", middleware };
}

function group(path: string, children: (Endpt | Middle | Group)[]): Group {
  return { type: "group", path, children };
}

type RouteConf = Group;

function createRouterFromConfig(config: RouteConf): Router {
  const router = new Router();
  for (const child of config.children) {
    if (child.type === "endpt") {
      switch (child.method) {
        case "GET":
          router.get(child.path, handlerToKoaMiddleware(child.handler));
          break;
        case "POST":
          router.post(child.path, handlerToKoaMiddleware(child.handler));
          break;
        case "PUT":
          router.put(child.path, handlerToKoaMiddleware(child.handler));
          break;
        case "DELETE":
          router.delete(child.path, handlerToKoaMiddleware(child.handler));
          break;
        case "PATCH":
          router.patch(child.path, handlerToKoaMiddleware(child.handler));
          break;
      }
    } else if (child.type === "middl") {
      router.use(...child.middleware);
    } else {
      router.use(createRouterFromConfig(child).routes());
    }
  }
  return new Router().use(config.path, router.routes());
}

const ROUTE_CONF: RouteConf = group("/api", [
  endpt("/health", GET, healthcheck),
]);

export default createRouterFromConfig(ROUTE_CONF).routes();
