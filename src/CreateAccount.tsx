import { useState } from "react"
import { useFormStatus } from "react-dom"

import { PBKDF2HashBase64 } from "./auth"

const CreateAccountBtn = () => {
  const { pending } = useFormStatus()
  return <button className="solid-btn" disabled={pending}>{pending ? "Please wait..." : "Create Account"}</button>
}

type Props = {
  onLogin?: () => void,
  addError: (e: string) => void
}

export default ({ onLogin, addError }: Props) => {

  const [formFields, setFormFields] = useState({ username: "", password: "" })

  const createAccount = async (formData: FormData) => {

    const submitted = {
      username: formData.get("username") as string,
      password: formData.get("password") as string
    }

    try {
      
      // Generate hash
      const salt = crypto.getRandomValues(new Uint8Array(16))

      let res: Response
      try {
        res = await fetch("/api/create-account", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: AbortSignal.timeout(1000),
          body: JSON.stringify({
            username: submitted.username,
            hash: await PBKDF2HashBase64(submitted.password, salt, 500000, 256),
            salt: salt.toBase64()
          })
        })
      } catch (e) {
        throw "could not reach server"
      }

      if (!res.ok) {
        if (res.status == 409) throw "username already taken"
        else if (res.status == 429) throw "rate limit hit"
        else if (res.status >= 500) throw "internal server error"
        else throw "unknown error"
      }

      // Success
      onLogin?.()


    } catch (e) {
      addError(typeof e === "string" ? e : "unknown error")
      setFormFields(submitted) // Restore the form fields after React has deleted them
    }
  }


  return (
    <main>
      <h1>Create Account</h1>
      <p>Making an account lets you edit the destination of all the URLs you create!</p>
      <form action={createAccount}>
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
            autoComplete="new-password"
            defaultValue={formFields.password}
            required
          />
        </label>
        <CreateAccountBtn />
      </form>
      <a href="/app/home">Back to Home</a>
    </main>
  )
}