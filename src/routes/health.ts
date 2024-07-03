import { resp, apihandler } from "../apibase.js"

export const healthcheck = apihandler({ handler: async () => resp(200, "ok") })
