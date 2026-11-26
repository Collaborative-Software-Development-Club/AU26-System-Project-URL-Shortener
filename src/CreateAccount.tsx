import { useState } from "react"
import { QueryClient, useMutation, useQueryClient } from "@tanstack/react-query"

import { createAccount as createAccountUser, type Credentials } from "./API"


export default function CreateAccount() {

  const [formFields, setFormFields] = useState<Credentials>({ username: "", password: "" })

  const queryClient = useQueryClient()

  const createAccount = useMutation({
    mutationFn: createAccountUser,
    retry: false,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["session"] })
      window.location.href = "/app/home"
    },
  })


  return (
    <main>
      <h1>Create Account</h1>
      <p>Making an account lets you edit the destination of all the URLs you create!</p>
      <form onSubmit={(event) => {
        event.preventDefault()
        if (!createAccount.isPending) createAccount.mutate(formFields)
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
            autoComplete="new-password"
            value={formFields.password}
            onChange={(event) => setFormFields({ ...formFields, password: event.target.value })}
            required
          />
        </label>
        {createAccount.error && <span className="inline-error" role="alert">Error: {createAccount.error.message}</span>}
        <button className="solid-btn" disabled={createAccount.isPending}>
          {createAccount.isPending ? "Please wait..." : "Create Account"}
        </button>
      </form>
      <a href="/app/home">Back to Home</a>
    </main>
  )
}
