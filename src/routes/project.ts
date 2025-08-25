import { resp, apihandler,err, z, FileSchema } from "../apibase.js"
import { getDbClient , QUERIES} from "../services/db/client.js"
import logger from "../services/logger.js";
const db = getDbClient();
// Example of API handler
export const createProject = apihandler({
  bodySchema: {
    name: z.string(),
  },
  respSchema: {
    name: z.string(),
  },
  errSchema: {
    errCode: z.string(),
    userMsg: z.string(),
  },
  handler: async ({ params, query, body, files, ctx }) => {
    // Handle the request here
    try {
        const user = ctx?.state.user;
        logger.info(user.id+" "+body.name)
        const result = await db.execQuery(QUERIES.INSERT_PROJECT, [body.name, user.id])
        return resp(200, "ok", { name: result.rows[0].name})
    } catch (error) {
        return err(401, "failed", {
            errCode: "FAILED",
            userMsg: "failed"+error,
        })
    }
    
  },
})
