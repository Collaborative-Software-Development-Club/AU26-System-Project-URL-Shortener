import { StrictMode, useState } from "react"
import { createRoot } from "react-dom/client"
import { useFormStatus } from "react-dom"

import "./index.css"
import Page from "./Page"
import { client } from "./API"

const LogoutButton = () => {
  const { pending } = useFormStatus()
  return (
    <button className="navbar-item-solid" disabled={pending}>
      {pending ? "Please wait..." : "Log Out"}
    </button>
  )
}


export default function App() {

  // Logged-in state management
  const [loggedIn, setLoggedIn] = useState< boolean | null >(null)
  const checkIfLoggedIn = async (): Promise<boolean> => {
    const l = Boolean(await cookieStore.get("logged-in"))
    setLoggedIn(l)
    return l
  }
  if (loggedIn === null) {
    checkIfLoggedIn()
    return
  }

  const logOut = async () => {
    try {
      client.api.logout.$post();
    } catch (e) {}
    // If logout somehow failed, display error page
    // Else, go home
    window.location.href = await checkIfLoggedIn() ? "/app/error?e=Could%20not%20connect%20to%20server." : "/app/home"
  }


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
      <Page onLogin={checkIfLoggedIn} loggedIn={loggedIn} />
    </>
  )
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)