import { z } from "zod"
import pg from "pg"

import env from "../config.js"
const client = new pg.Client({
  host: env.DBHOST,
  port: env.DBPORT,
  user: env.DBUSER,
  password: env.DBPASS,
  database: env.DBNAME,
})

await client.connect()

enum QUERIES {
  SELECT_NOW = `
    SELECT NOW();
  `,
  INSERT_USER = `
    INSERT INTO users (name, email, password)
    VALUES ($1, $2, $3)
    RETURNING id::text, name, email;
  `,
  GET_USER_BY_EMAIL = `
    SELECT id::text, name, email, password
    FROM users
    WHERE email = $1;
  `
}

type ColumnValueTypes =
  | z.ZodString
  | z.ZodNumber
  | z.ZodDate
  | z.ZodBoolean
  | z.ZodNullable<ColumnValueTypes>

const QUERY_TO_Z_MAPPING = {
  [QUERIES.SELECT_NOW]: {
    args: [],
    rows: {
      now: z.date(),
    },
  },
  [QUERIES.INSERT_USER]: {
    args: [z.string(), z.string().email(), z.string()], // name, email, password
    rows: {
      id: z.string(), // UUID or use z.number().int() if SERIAL
      name: z.string(),
      email: z.string().email(),
    },
  },
  [QUERIES.GET_USER_BY_EMAIL]: {
    args: [z.string().email()], // email to look for
    rows: {
      id: z.string(),
      name: z.string(),
      email: z.string().email(),
      password: z.string(),
    },
  },
} satisfies {
  [Q in QUERIES]: {
    args: [ColumnValueTypes, ...ColumnValueTypes[]] | []
    rows: {
      [k: string]: ColumnValueTypes
    }
  }
}


interface QueryResult<T = Record<string, unknown>> {
  rows: T[]
}

type Args<Q extends QUERIES> = z.infer<
  z.ZodTuple<(typeof QUERY_TO_Z_MAPPING)[Q]["args"]>
>

type Rows<Q extends QUERIES> = z.infer<
  z.ZodObject<(typeof QUERY_TO_Z_MAPPING)[Q]["rows"]>
>

interface QueryExecutor {
  execQuery<Q extends QUERIES>(
    query: Q,
    args?: Args<Q>,
  ): Promise<QueryResult<Rows<Q>>>
  transaction<T>(fn: () => Promise<T>): Promise<T>
}

class DatabaseError extends Error {
  readonly code: string
  readonly constraint: string | null
  constructor(
    message: string,
    code: string,
    constraint: string | null,
    opts: ErrorOptions = {},
  ) {
    super(message, opts)
    this.name = "DatabaseError"
    this.code = code
    this.constraint = constraint
  }

  toString() {
    return `${this.name}: ${this.message} (code: ${this.code} constraint: ${this.constraint})`
  }
}

class DatabaseSchemaValidationError extends Error {
  constructor(
    message: string,
    public readonly zodErr: z.ZodError,
  ) {
    super(message)
    this.name = "DatabaseSchemaValidationError"
    this.message = `${message}\nZodError: ${zodErr.message}`
  }
}

function zodparse<Z extends z.ZodTypeAny>(
  schema: Z,
  value: unknown,
  errMsg: string = "Schema validation failed",
): z.infer<Z> {
  const parsed = schema.safeParse(value)
  if (!parsed.success) {
    throw new DatabaseSchemaValidationError(errMsg, parsed.error)
  }
  return parsed.data
}

type DbClientOptions = { logQueries?: boolean; validateResults?: boolean }

function getDbClient(opts: DbClientOptions = {}): QueryExecutor {
  return {
    execQuery: (async (
      query: QUERIES,
      args: Args<QUERIES> = [],
    ): Promise<QueryResult<Rows<QUERIES>>> => {
      const { logQueries = false, validateResults = true } = opts
      if (logQueries) {
        console.log(`Running query:`, query, args)
      }
      args = zodparse(
        z.tuple(QUERY_TO_Z_MAPPING[query].args),
        args,
        `Schema validation failed for arguments of query: ${query}`,
      )
      let rows: unknown[]
      try {
        const result = await client.query<Rows<QUERIES>>(query, args)
        rows = result.rows
      } catch (e) {
        const err = e as any
        if (err.message && err.code) {
          throw new DatabaseError(
            err.message,
            err.code,
            err.constraint || null,
            {
              cause: err,
            },
          )
        }
        throw e
      }
      if (validateResults) {
        rows = zodparse(
          z.array(z.object(QUERY_TO_Z_MAPPING[query].rows)),
          rows,
          `Schema validation failed for results of query: ${query}`,
        )
      }
      return {
        rows: rows as Rows<QUERIES>[],
      }
    }) as <Q extends QUERIES>(
      query: Q,
      args?: Args<Q>,
    ) => Promise<QueryResult<Rows<Q>>>,

    async transaction<T>(fn: () => Promise<T>): Promise<T> {
      await client.query("BEGIN;")
      try {
        const result = await fn()
        await client.query("COMMIT;")
        return result
      } catch (e) {
        await client.query("ROLLBACK;")
        throw e
      }
    },
  }
}

export { getDbClient, QUERIES, DatabaseError }
