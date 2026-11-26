import { useState } from "react"

import { loginUser, type Credentials } from "./API"
import { useMutation } from "@tanstack/react-query"

type Props = {
  onLogin?: () => void,
}
export default function Login({ onLogin }: Props) {

  const [formFields, setFormFields] = useState<Credentials>({ username: "", password: "" })

  const login = useMutation({
    mutationFn: loginUser,
    retry: false,
    onSuccess: async () => {
      await onLogin?.()
      window.location.href = "/app/home"
    },
  })


  return (
    <main>
      <h1>Log In</h1>
      <form onSubmit={(event) => {
        event.preventDefault()
        if (!login.isPending) login.mutate(formFields)
      }}>
        <label>
          Username
          <input
            type="text"
            name="username"
            autoComplete="username"
            spellCheck="false"
            value={formFields.username}
            onChange={(event) => setFormFields({ ...formFields, username: event.target.value })}
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
            value={formFields.password}
            onChange={(event) => setFormFields({ ...formFields, password: event.target.value })}
            required
          />
        </label>
        {login.error && <span className="inline-error" role="alert">Error: {login.error.message}</span>}
        <button className="solid-btn" disabled={login.isPending}>
          {login.isPending ? "Please wait..." : "Log In"}
        </button>
      </form>
      <a href="/app/home">Back to Home</a>
    </main>
  )
}
