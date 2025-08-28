import { resp, apihandler, err, z, FileSchema } from "../apibase.js"
import { getDbClient, QUERIES } from "../services/db/client.js"
import logger from "../services/logger.js";
const db = getDbClient();
// Example of API handler
export const createProject = apihandler({
  bodySchema: {
    name: z.string(),
  },
  respSchema: {
    projectDetails: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        created_by: z.string(),
      })
    )
  },
  errSchema: {
    errCode: z.string(),
    userMsg: z.string(),
  },
  handler: async ({ params, query, body, files, ctx }) => {
    // Handle the request here
    try {
      const user = ctx?.state.user;
      const response = await db.execQuery(QUERIES.GET_PROJECT_BY_NAME, [body.name, user.id]);
      if(response.rows.length>0){
        return err(400, "Table already exist", {
          errCode: "TABLE_CREATION_FAILED",
          userMsg: "Table with similar name already exist"
        })
      }
      const result = await db.execQuery(QUERIES.INSERT_PROJECT, [body.name, user.id])
      const projectDetails = [{ id: result.rows[0].id, name: result.rows[0].name, created_by: result.rows[0].created_by }]
      return resp(200, "ok", { projectDetails })
    } catch (error) {
      return err(401, "failed", {
        errCode: "FAILED",
        userMsg: "failed" + error,
      })
    }

  },
})

export const getProjects = apihandler({
  respSchema: {
    projects: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        created_by: z.string()
      })
    )
  },
  errSchema: {
    errCode: z.string(),
    userMsg: z.string(),
  },
  handler: async ({ params, query, body, files, ctx }) => {
    // Handle the request here
    try {
      const result = await db.execQuery(QUERIES.GET_PROJECTS, [])
      const projects = result.rows.map((curr) => {
        return {
          id: curr.id,
          name: curr.name,
          created_by: curr.created_by,
        }
      })
      logger.info(JSON.stringify(projects, null, 2));
      return resp(200, "ok", { projects })
    } catch (error) {
      return err(401, "failed", {
        errCode: "FAILED",
        userMsg: "failed" + error,
      })
    }

  },
})

export const deleteProject = apihandler({
  paramsSchema: {
    id:z.string(),
  },
  respSchema: {
    message:z.string(),
  },
  errSchema: {
    errCode: z.string(),
    userMsg: z.string(),
  },
  handler: async ({ params }) => {
    console.log(params.id)
    try {
      await db.execQuery(QUERIES.DELETE_PROJECT, [params.id])
      return resp(200, "ok", {message: "Project deleted successfully"})
    } catch (error) {
      return err(401, "failed", {
        errCode: "DELETION FAILED",
        userMsg: "error in deleting the project"
      })
    }
  },
})

export const updateProjectName = apihandler({
  paramsSchema: {
    id: z.string(),
  },
  bodySchema: {
    name: z.string(),
  },
  respSchema: {
    id: z.string(),
    name: z.string(),
    created_by: z.string(),
  },
  errSchema: {
    errCode: z.string(),
    userMsg: z.string(),
  },
  handler: async ({ params, query, body, files, ctx }) => {
    // Handle the request here
    try {
      
      const response = await db.execQuery(QUERIES.UPDATE_PROJECT, [body.name, params.id])
      return resp(200, "ok", {id: response.rows[0].id , name: response.rows[0].name, created_by: response.rows[0].created_by})
    } catch (error) {
      return err(500, "Updation failed", {
        errCode: "ERROR IN UPDATING THE TABLE",
        userMsg: "Project updation failed"+error
      })
    }
  },
})
