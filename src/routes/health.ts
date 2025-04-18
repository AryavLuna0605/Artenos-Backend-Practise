import { resp, apihandler, z, FileSchema } from "../apibase.js"

export const healthcheck = apihandler({ handler: async () => resp(200, "ok") })

// Example of API handler
const exampleHandler = apihandler({
  paramsSchema: {
    id: z.string(),
  },
  querySchema: {
    q: z.string().optional(),
  },
  bodySchema: {
    name: z.string(),
    age: z.number().int().positive(),
  },
  fileSchema: {
    resume: z.array(FileSchema).max(2),
  },
  respSchema: {
    id: z.string(),
    name: z.string(),
    age: z.number().int().positive(),
  },
  errSchema: {
    errCode: z.string(),
    userMsg: z.string(),
  },
  handler: async ({ params, query, body, files }) => {
    // Handle the request here
    return resp(200, "ok", { id: params.id, name: body.name, age: body.age })
  },
})
