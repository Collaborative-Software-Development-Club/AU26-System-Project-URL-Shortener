import { useState } from "react"

type Props = {
  onLogin?: () => void,
  addError: (e: string) => void
}

export default ({ onLogin, addError }: Props) => {

  const [btnDisabled, setBtnDisabled] = useState(false)
  const [formFields, setFormFields] = useState({ username: "", password: "" })

  const createAccount = async (formData: FormData) => {

    const submitted = {
      username: formData.get("username") as string,
      password: formData.get("password") as string
    }

    try {

      if (submitted.username.length >= 64) throw "username too long"

      setBtnDisabled(true)
      
      // Generate hash
      const salt = crypto.getRandomValues(new Uint8Array(16))
      const iterations = 500000
      const length = 256
      const hashBits = await crypto.subtle.deriveBits(
        { name: "PBKDF2", hash: "SHA-256", salt, iterations },
        await crypto.subtle.importKey(
          "raw",
          new TextEncoder().encode(submitted.password),
          "PBKDF2",
          false,
          [ "deriveBits" ]
        ),
        length
      )
      const hash = new Uint8Array(hashBits).toBase64()

      let res: Response
      try {
        res = await fetch("/api/create-account", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: AbortSignal.timeout(1000),
          body: JSON.stringify({
            username: submitted.username,
            hash,
            hashInfo: { salt: salt.toBase64(), iterations, length }
          })
        })
      } catch (e) {
        throw "could not reach server"
      }

      if (!res.ok) {
        if (res.status == 409) throw "username already taken"
        else if (res.status == 429) throw "rate limit hit"
        else throw "internal server error"
      }

      onLogin?.()


    } catch (e) {
      if (typeof e === "string") {
        addError(e)
        setBtnDisabled(false)
        setFormFields(submitted) // Restore the form fields after React has deleted them
      } else throw e
    }
  }


  return (
    <main>
      <h1>Create Account</h1>
      <p>Making an account lets you edit the destination of all the URLs you create!</p>
      <form action={createAccount}>
        <label>
          Username
          <input type="text" name="username" autoComplete="username" spellCheck="false" defaultValue={formFields.username} required />
        </label>
        <label>
          Password
          <input type="password" name="password" autoComplete="new-password" defaultValue={formFields.password} required />
        </label>
        <button className="solid-btn" disabled={btnDisabled}>Create Account</button>
      </form>
      <a href="/app/home">Back to Home</a>
    </main>
  )
}