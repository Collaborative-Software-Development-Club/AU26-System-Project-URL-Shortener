import { hc } from "hono/client";
import type { Server } from "../worker";
import { PBKDF2HashBase64 } from "./auth";

export const client = hc<Server>("/");

export type Credentials = { username: string, password: string }

export async function loginUser(submitted: Credentials) {
  const hashInfo = await client.api["hash-information"].$get({
    query: { username: submitted.username }
  })

  if (!hashInfo.ok) {
    if (hashInfo.status === 404) throw new Error("user does not exist")
    else if (hashInfo.status === 429) throw new Error("rate limit hit")
    else if (hashInfo.status >= 500) throw new Error("internal server error")
    else throw new Error("unknown error")
  }

  const hashObj = await hashInfo.json()
  const salt = Uint8Array.fromBase64(hashObj.salt)

  // Finish hashing before starting the login request's timeout.
  const hash = await PBKDF2HashBase64(submitted.password, salt, 500000, 256)
  const loginRes = await client.api.login.$post({
    json: { username: submitted.username, hash }
  })

  if (!loginRes.ok) {
    if (loginRes.status >= 500) throw new Error("internal server error")
    else throw new Error("Could not log in. Check your credentials.")
  }
}

export async function createAccount(submitted: Credentials) {
  const salt = crypto.getRandomValues(new Uint8Array(16))

  // Finish hashing before starting the signup request's timeout.
  const hash = await PBKDF2HashBase64(submitted.password, salt, 500000, 256)
  const res = await client.api["create-account"].$post({
    json: {
      username: submitted.username,
      hash,
      salt: salt.toBase64()
    }
  })

  if (!res.ok) {
    if (res.status >= 500) throw new Error("internal server error")
    else throw new Error("Could not create account")
  }
}

export async function getUrls(page: number) {
  const response = await client.api.user.urls.$get({
    query: { page: String(page) }
  })

  if (!response.ok) {
    throw new Error("Could not load URLs")
  }

  const data = await response.json()
  return data.urls;
}

export async function shortenUrl(url: string) {
  const response = await client.api.shorten.$post({
    form: { url }
  })

  if (!response.ok) {
    let reason = "Could not shorten URL"
    if (response.status === 429) reason = "Rate limit reached"

    throw new Error(reason)
  }

  return await response.json()
}
