import { hc } from "hono/client";
import type { Server } from "../worker";

export const client = hc<Server>("/");