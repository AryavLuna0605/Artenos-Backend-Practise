import multer from "@koa/multer"
import Router from "@koa/router"
import Koa from "koa"
import { z } from "zod"

interface BaseBody {}

export class APIError<T extends BaseBody> {
  readonly ok = false
  readonly message: string
  readonly status: number
  readonly data: T

  /**
   * @deprecated Use {@link err} instead
   */
  constructor(status: number, message: string, body = {} as T) {
    this.message = message
    this.status = status
    this.data = body

    if (this.status < 400 || this.status >= 600) {
      throw new Error(
        `status code must be between 400 and 599, got ${this.status}`,
      )
    }
  }
}

const FileSchema = z.object({
  filename: z.string().min(1),
  mimetype: z.string().min(1),
  bytes: z.instanceof(Buffer),
})

type File = z.infer<typeof FileSchema>

export const fileSchema = z.object({
  filename: z.string().min(1),
  mimetype: z.string().min(1),
  path: z.string().min(1),
  bytes: z.number().int().positive().optional(),
})

export function err<T extends BaseBody>(
  status: number,
  message: string,
  body = {} as T,
) {
  return new APIError(status, message, body)
}

export class APIResponse<T extends BaseBody> {
  readonly ok = true
  readonly status: number
  readonly message: string
  readonly data: T

  /**
   * @deprecated Use {@link resp} instead
   */
  constructor(status: number, message: string, body = {} as T) {
    this.status = status
    this.message = message
    this.data = body

    if (this.status < 200 || this.status >= 300) {
      throw new Error(
        `status code must be between 200 and 299, got ${this.status}`,
      )
    }
  }
}

export function resp<T extends BaseBody>(
  status: number,
  message: string,
  body = {} as T,
) {
  return new APIResponse(status, message, body)
}

type APIHandler<
  TParams extends z.ZodRawShape,
  TQuery extends z.ZodRawShape,
  TBody extends z.ZodRawShape,
  TFiles extends Record<string, { maxCount: number }>,
  TResp extends z.ZodRawShape,
  TErr extends z.ZodRawShape,
> = {
  paramsSchema?: TParams
  querySchema?: TQuery
  bodySchema?: TBody
  fileSchema?: TFiles
  respSchema?: TResp
  errSchema?: TErr
  handler: (handlerCtx: {
    params: z.infer<z.ZodObject<TParams>>
    query: z.infer<z.ZodObject<TQuery>>
    body: z.infer<z.ZodObject<TBody>>
    files: { [Key in keyof TFiles]: File[] }
    headers: Koa.Request["headers"]
  }) => Promise<
    | APIResponse<z.infer<z.ZodObject<TResp>>>
    | APIError<z.infer<z.ZodObject<TErr>>>
  >
}

export function apihandler<
  TParams extends z.ZodRawShape = {},
  TQuery extends z.ZodRawShape = {},
  TBody extends z.ZodRawShape = {},
  TFiles extends Record<string, { maxCount: number }> = {},
  TResp extends z.ZodRawShape = {},
  TErr extends z.ZodRawShape = {},
>(apiHander: APIHandler<TParams, TQuery, TBody, TFiles, TResp, TErr>) {
  return apiHander
}

function handlerToKoaMiddleware(
  opts: APIHandler<
    z.ZodRawShape,
    z.ZodRawShape,
    z.ZodRawShape,
    Record<string, { maxCount: number }>,
    z.ZodRawShape,
    z.ZodRawShape
  >,
): Koa.Middleware {
  const {
    paramsSchema = {},
    querySchema = {},
    bodySchema = {},
    fileSchema = {},
    respSchema = {},
    errSchema = {},
    handler,
  } = opts
  return async (ctx) => {
    const reqBodyObj = ctx.request.body || {}
    const reqBody = z.object(bodySchema).safeParse(reqBodyObj)
    if (reqBody.success === false) {
      throw err(400, "Invalid request body", {
        errors: reqBody.error.errors,
      })
    }

    const fileFieldsObj: { [key: string]: File[] } = {}
    if (ctx.files) {
      for (const files of ctx.files as multer.File[]) {
        if (!fileFieldsObj[files.fieldname]) {
          fileFieldsObj[files.fieldname] = []
        }
        fileFieldsObj[files.fieldname].push({
          filename: files.originalname,
          mimetype: files.mimetype,
          bytes: files.buffer,
        })
      }
    }
    const fileFieldsShape: Record<string, z.ZodTypeAny> = {}
    for (const [fieldName, fieldOptions] of Object.entries(fileSchema)) {
      fileFieldsShape[fieldName] = z
        .array(FileSchema)
        .max(fieldOptions.maxCount)
    }
    const FileFieldsSchema = z.object(fileFieldsShape)
    const fileFields = FileFieldsSchema.safeParse(fileFieldsObj)
    if (fileFields.success === false) {
      throw err(400, "Invalid file fields", {
        errors: fileFields.error.errors,
      })
    }

    const params = z.object(paramsSchema).strict().safeParse(ctx.params)
    if (params.success === false) {
      throw err(400, "Invalid URL params", {
        errors: params.error.errors,
      })
    }

    const query = z.object(querySchema).safeParse(ctx.request.query)
    if (query.success === false) {
      throw err(400, "Invalid query params", {
        errors: query.error.errors,
      })
    }

    const result = await handler({
      params: params.data,
      query: query.data,
      body: reqBody.data,
      files: fileFields.data,
      headers: ctx.request.headers,
    })

    if (result instanceof APIResponse) {
      const respBody = z.object(respSchema).safeParse(result.data)
      if (respBody.success === false) {
        throw new Error(`Invalid response body: ${respBody.error}`)
      }
      ctx.body = resp(result.status, result.message, respBody.data)
    } else if (result instanceof APIError) {
      const errBody = z.object(errSchema).strict().safeParse(result.data)
      if (errBody.success === false) {
        throw new Error(`Invalid error body: ${errBody.error}`)
      }
      throw err(result.status, result.message, errBody.data)
    } else {
      throw new Error(
        `Invalid handler return value: ${result} of type ${typeof result}`,
      )
    }
  }
}

export const GET = "GET"
export const POST = "POST"
export const PUT = "PUT"
export const DELETE = "DELETE"
export const PATCH = "PATCH"

type Method = "GET" | "POST" | "PUT" | "DELETE" | "PATCH"

type Endpt = {
  type: "endpt"
  method: Method
  path: string
  handler: APIHandler<any, any, any, any, any, any>
}

type Middle = {
  type: "middl"
  middleware: Koa.Middleware[]
}

type Group = {
  type: "group"
  path: string
  children: (Endpt | Middle | Group)[]
}

export function endpt(
  path: string,
  method: Method,
  handler: APIHandler<any, any, any, any, any, any>,
): Endpt {
  return { type: "endpt", method, path, handler }
}

export function middl(...middleware: Koa.Middleware[]): Middle {
  return { type: "middl", middleware }
}

export function group(
  path: string,
  children: (Endpt | Middle | Group)[],
): Group {
  return { type: "group", path, children }
}

export type RouteConf = Group

export function createRouterFromConfig(config: RouteConf): Router {
  const router = new Router()
  for (const child of config.children) {
    if (child.type === "endpt") {
      switch (child.method) {
        case "GET":
          router.get(child.path, handlerToKoaMiddleware(child.handler))
          break
        case "POST":
          router.post(child.path, handlerToKoaMiddleware(child.handler))
          break
        case "PUT":
          router.put(child.path, handlerToKoaMiddleware(child.handler))
          break
        case "DELETE":
          router.delete(child.path, handlerToKoaMiddleware(child.handler))
          break
        case "PATCH":
          router.patch(child.path, handlerToKoaMiddleware(child.handler))
          break
      }
    } else if (child.type === "middl") {
      router.use(...child.middleware)
    } else {
      router.use(createRouterFromConfig(child).routes())
    }
  }
  return new Router().use(config.path, router.routes())
}

export { z }
