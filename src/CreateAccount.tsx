import { useState, type ChangeEvent } from "react"

export default ({ onLogin }: { onLogin?: () => void }) => {

  const [username, setUsername] = useState("") // Needed to prevent React from clearing input on submit
  const [password, setPassword] = useState("") // Needed to prevent React from clearing input on submit
  const [btnDisabled, setBtnDisabled] = useState(false)
  const [btnText, setBtnText] = useState("Create Account")

  const createAccount = async (formData: FormData) => {

    setBtnText("Please wait...")
    setBtnDisabled(true)
    
    const salt = crypto.getRandomValues(new Uint8Array(16))
    const iterations = 500000
    const length = 256
    const hashBits = await crypto.subtle.deriveBits(
      { name: "PBKDF2", hash: "SHA-256", salt, iterations },
      await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(formData.get("password") as string),
        "PBKDF2",
        false,
        [ "deriveBits" ]
      ),
      length
    )

    let res: Response
    try {
      res = await fetch("/api/create-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.get("username"), // TODO enforce length restriction
          hash: new Uint8Array(hashBits).toBase64(),
          hashInfo: { salt: salt.toBase64(), iterations, length }
        })
      })
    } catch (e) {
      setBtnText("Error: could not reach server")
      setBtnDisabled(false)
      return
    }

    if (!res.ok) {
      if (res.status == 409) setBtnText("Error: username taken")
      else if (res.status == 429) setBtnText("Error: rate limit hit")
      else setBtnText("Error: internal server error")
      return
    }

    onLogin?.()

  }

  const usernameInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value)
    setBtnDisabled(false)
  }
  const passwordInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
    setBtnDisabled(false)
  }

  return (
    <main>
      <h1>Create Account</h1>
      <p>Making an account lets you edit the destination of all the URLs you create!</p>
      <form action={createAccount}>
        <label>
          Username
          <input type="text" name="username" autoComplete="username" spellCheck="false" onChange={usernameInputChange} value={username} required />
        </label>
        <label>
          Password
          <input type="password" name="password" autoComplete="new-password" onChange={passwordInputChange} value={password} required />
        </label>
        <button className="solid-btn" disabled={btnDisabled}>{btnText}</button>
      </form>
      <a href="/app/home">Back to Home</a>
    </main>
  )
}