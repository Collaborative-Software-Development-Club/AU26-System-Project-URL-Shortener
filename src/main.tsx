import { StrictMode, useState, useEffect } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
import Home from "./Home.tsx"
import Login from "./Login.tsx"
import CreateAccount from "./CreateAccount.tsx"
import NotFound from "./NotFound.tsx"


export const App = () => {

  const [loggedIn, setLoggedIn] = useState(false)
  const [logoutBtnText, setLogoutBtnText] = useState("Log Out")
  const checkIfLoggedIn = async () => setLoggedIn(Boolean(await cookieStore.get("logged-in")))
  const logOut = (e: React.MouseEvent) => {
    e.preventDefault()
    setLogoutBtnText("Logging out...")

    

  }


  // Main body -- everything below the header.
  const Page = () => {
    const [path, setPath] = useState(window.location.pathname)

    // Handle link clicks and browser navigation buttons
    useEffect(() => {
      const handleNavigation = (event: NavigateEvent) => {
        if (!event.canIntercept) return
        if (event.hashChange) return
        if (event.downloadRequest) return

        event.intercept({
          handler() {
            if (document.activeElement instanceof HTMLElement) {
              document.activeElement.blur() // fix bug in Safari where password autocomplete ui would persist after navigation
            }
            const url = new URL(event.destination.url)
            setPath(url.pathname)
          }
        })

      }

      navigation.addEventListener("navigate", handleNavigation)
      return () => {
        navigation.removeEventListener("navigate", handleNavigation)
      }
    })

    switch (path) {
      case "/app/home":
        return <Home />
      case "/app/login":
        return <Login onLogin={checkIfLoggedIn} />
      case "/app/create-account":
        return <CreateAccount onLogin={checkIfLoggedIn} addError={addError}/>
      default:
        return <NotFound />
    }
  }


  // Error handling

  // const [errors, setErrors] = useState<string[]>([])
  // const addError = (e: string) => setErrors([e, ...errors])
  const [eCount, setECount] = useState(0)
  const [errors, setErrors] = useState<string[]>([])
  const addError = (e: string) => {setErrors([e+eCount, ...errors]);setECount(eCount+1)}


  return (
    <>
      <header>
        <a className="logo" href="/app/home">ShortWork Pro</a>
        <div className="flex-space" />
        {
          loggedIn ? <>
            <a className="navbar-item" href="/app/my-urls">My URLs</a>
            <a className="navbar-item-solid" onClick={logOut}>{logoutBtnText}</a>
          </> : <>
            <a className="navbar-item" href="/app/login">Log In</a>
            <a className="navbar-item-solid" href="/app/create-account">Create Account</a>
          </>
        }
      </header>
      <Page />
      <div className="errors">
        {errors.map((e, i) => (
          <div className="error">
            Error: {e}
            <button onClick={() => setErrors(errors.filter((e2, i2) => i2 !== i))}>
              Delete
            </button>
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