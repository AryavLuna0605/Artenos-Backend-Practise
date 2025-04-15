import Koa from "koa";
import { APIResponse, APIError, err } from "../apibase.js";

/**
 * Middleware that enforces API conventions and converts APIResponse and APIError
 * objects to the appropriate HTTP response.
 *
 * Logs a message and returns a generic 500 JSON repsonse if the response body
 * is not an instance of APIResponse, or if the error is not an instance of APIError.
 */
export const apiConventions: Koa.Middleware = async (ctx, next) => {
  try {
    await next();
    // In Koa, the status is 404 by default, and remains 404 if no routes match.
    // We want to return a 404 JSON response in this case.
    if (ctx.status === 404) {
      throw err(404, "Not found");
    }
    if (!(ctx.body instanceof APIResponse)) {
      throw new Error(
        `Invalid response body, has to be an instance of ${APIResponse.name}. Got ${ctx.body}`,
      );
    }
    const resp = ctx.body;
    ctx.status = resp.status;
    ctx.body = {
      status: resp.status,
      message: resp.message,
      ...resp.data,
    };
  } catch (e) {
    let apiErr: APIError<{}>;
    if (e instanceof APIError) {
      apiErr = e;
    } else {
      // TODO: Use logger here
      console.error(`Caught error in middleware:`, e);
      console.warn(
        `This error was converted to a generic 500 response because it was not an ${APIError.name}.`,
        `Use ${APIError.name} to return a custom error response.`,
      );
      apiErr = err(500, "Unexpected error");
    }
    ctx.status = apiErr.status;
    ctx.body = {
      status: apiErr.status,
      message: apiErr.message,
      ...apiErr.data,
    };
  }
};
