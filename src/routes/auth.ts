import { resp, apihandler, z, err } from "../apibase.js"
import env from "../services/config.js"
import { getDbClient, QUERIES } from "../services/db/client.js"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

const db = getDbClient()
const jwtSecretKey = env.JWT_SECRET_KEY;

export const createUser = apihandler({
  bodySchema: {
    name: z.string(),
    email: z.string().email(),
    password: z.string().min(6),
  },
  respSchema: {
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
  },
  errSchema: {
    errCode: z.any(),
    userMsg: z.string(),
  },
  handler: async ({ body }) => {
    try {
      const hashedPassword = await bcrypt.hash(body.password, 10);
      const result = await db.execQuery(QUERIES.INSERT_USER, [
        body.name,
        body.email,
        hashedPassword,
      ])

      console.log(result.rows+"yay---------------");
      const row = result.rows[0]
      
      return resp(201, "User registered successfully", {
        id: String(row.id),
        name: row.name,
        email: row.email,
      })
    } catch (error) {
      return err(500, "User creation failed", {
        errCode: "USER_CREATION_FAILED",
        userMsg: "Unable to register",
      })
    }
  },
})

export const loginUser = apihandler({
  bodySchema: {
    email: z.string().email(),
    password: z.string().min(6),
  },
  respSchema: {
    name: z.string(),
    email: z.string().email(),
  },
  errSchema: {
    errCode: z.string(),
    userMsg: z.string(),
  },
  handler: async ({params, query, body, files, ctx}) => {
    try {
      const result = await db.execQuery(QUERIES.GET_USER_BY_EMAIL, [body.email]);
      if(result.rows.length===0) return err(401, "Login failed", {
        errCode: "USER_NOT_FOUND",
        userMsg: "Email not registered",
      })

      const user = result.rows[0];
      const isValid = await bcrypt.compare(body.password, user.password);
      if(!isValid) return err(401, "Login failed", {
        errCode: "INVALID_PASSWORD",
        userMsg: "Incorrect password",
      })

      const token = jwt.sign(
        {id: user.id, email: user.email},
        jwtSecretKey,
        {expiresIn: "7d",}
      )
      
      ctx?.cookies.set("token", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        maxAge: 24 * 60 * 60 * 1000 * 7,
      })

      return resp(200, "Login Successful", {
        name: user.name,
        email: user.email,
      })
    } catch (error) {
      return err(500, "User creation failed", {
        errCode: "USER_CREATION_FAILED",
        userMsg: "Unable to register"+error,
      })
    }
  },
})