import { useState } from "react"
import { useFormStatus } from "react-dom"

import { PBKDF2HashBase64 } from "./auth"
import { client } from "./API"

const LogInBtn = () => {
  const { pending } = useFormStatus()
  return <button className="solid-btn" disabled={pending}>{pending ? "Please wait..." : "Log In"}</button>
}

type Props = {
  onLogin?: () => void,
}
export default function Login({ onLogin }: Props) {

  const [formFields, setFormFields] = useState({ username: "", password: "" })
  const [errorMessage, setError] = useState("")

  const logIn = async (formData: FormData) => {

    const submitted = {
      username: formData.get("username") as string,
      password: formData.get("password") as string
    }

    try {

      // Fetch salt
      const hashInfo = await client.api["hash-information"].$get({
        query: { username: submitted.username }
      })

      if (!hashInfo.ok) {
        if (hashInfo.status == 404) throw "user does not exist"
        else if (hashInfo.status == 429) throw "rate limit hit"
        else if (hashInfo.status >= 500) throw "internal server error"
        else throw "unknown error"
      }

      const hashObj = await hashInfo.json();
      const salt = Uint8Array.fromBase64(hashObj.salt);

      const hash = await PBKDF2HashBase64(submitted.password, salt, 500000, 256) // Needed seperate variable otherwise timeout would start when hash is being created, before the request is sent
      const loginRes = await client.api.login.$post({
        json: {
          username: submitted.username,
          hash
        }
      })

      if (!loginRes.ok) {
        if (loginRes.status >= 500) throw "internal server error"
        else throw "unknown error"
      }

      // Success
      onLogin?.()
      window.location.href = "/app/home"


    } catch (e) {
      setError(typeof e === "string" ? e : "unknown error")
      setFormFields(submitted) // Restore the form fields after React has deleted them
    }

  }


  return (
    <main>
      <h1>Log In</h1>
      <form action={logIn}>
        <label>
          Username
          <input
            type="text"
            name="username"
            autoComplete="username"
            spellCheck="false"
            defaultValue={formFields.username}
            maxLength={63}
            pattern="[\w\-]+"
            title="Must consist of letters, numbers, underscore, and hyphen."
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            defaultValue={formFields.password}
            required
          />
        </label>
        {errorMessage && <span className="inline-error">Error: {errorMessage}</span>}
        <LogInBtn />
      </form>
      <a href="/app/home">Back to Home</a>
    </main>
  )
}