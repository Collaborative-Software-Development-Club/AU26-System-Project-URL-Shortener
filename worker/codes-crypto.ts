import { env } from "cloudflare:workers"

const spaceMultiplier = 2**12; // 1 out of every 2**12 possible URL's will be active

export const encode = async (id: number): Promise<string> => {
  return ""
}

export const decode = async (code: string): Promise<number> => {
  return 0
}