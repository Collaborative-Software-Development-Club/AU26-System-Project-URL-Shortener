import { StrictMode, useState } from "react"
import { createRoot } from "react-dom/client"
import { useFormStatus } from "react-dom"

import "./index.css"
import Page from "./Page"

const LogoutButton = () => {
  const { pending } = useFormStatus()
  return (
    <button className="navbar-item-solid" disabled={pending}>
      {pending ? "Please wait..." : "Log Out"}
    </button>
  )
}


const App = () => {

  // Logged-in state
  const [loggedIn, setLoggedIn] = useState(false)
  const checkIfLoggedIn = async () => setLoggedIn(Boolean(await cookieStore.get("logged-in")))
  checkIfLoggedIn()
  const logOut = async () => {
    await fetch("/api/logout", { method: "POST" })
    // TODO add logout error page if connection failed, or simply didn't remove cookies
    await checkIfLoggedIn()
  }

  // Error handling
  const [errors, setErrors] = useState<string[]>([])
  const addError = (e: string) => setErrors([e, ...errors]) // TODO
  // TODO make them disappear after a few seconds
  // TODO make errors specific to each page


  return (
    <>
      <header>
        <a className="logo" href="/app/home">ShortWork Pro</a>
        <div className="flex-space" />
        {
          loggedIn ? <>
            <a className="navbar-item" href="/app/my-urls">My URLs</a>
            <form action={logOut}>
              <LogoutButton />
            </form>
          </> : <>
            <a className="navbar-item" href="/app/login">Log In</a>
            <a className="navbar-item-solid" href="/app/create-account">Create Account</a>
          </>
        }
      </header>
      <Page onLogin={checkIfLoggedIn} addError={addError} loggedIn={loggedIn} />
      <div className="errors">
        {errors.map((e, i) => (
          <div className="error">
            Error: {e}
            <button onClick={() => setErrors(errors.filter((_, i2) => i !== i2))}>
              Clear
            </button>{/* TODO make this an svg X */}
          </div>
        ))}
      </div>
    </>
  )
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)