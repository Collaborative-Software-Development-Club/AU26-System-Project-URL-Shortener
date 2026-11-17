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
  const checkIfLoggedIn = () => setLoggedIn(Boolean(cookieStore.get("logged-in")))
  const logOut = (e: React.MouseEvent) => {
    e.preventDefault()
    setLogoutBtnText("Logging out...")

    

  }

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


  let page
  switch (path) {
    case "/app/home":
      page = <Home />
      break
    case "/app/login":
      page = <Login onLogin={checkIfLoggedIn} />
      break
    case "/app/create-account":
      page = <CreateAccount onLogin={checkIfLoggedIn} />
      break
    default:
      page = <NotFound />
  }

  return (
    <>
      <header>
        <a className="logo" href="/app/home">ShortWork Pro</a>
        <div className="flex-space" />
        {
          loggedIn ? <>
            <a className="navbar-item" href="/app/login">Log In</a>
            <a className="navbar-item-solid" href="/app/create-account">Create Account</a>
          </> : <>
            <a className="navbar-item" href="/app/my-urls">My URLs</a>
            <a className="navbar-item-solid" onClick={logOut}>{logoutBtnText}</a>
          </>
        }
      </header>
      {page}
    </>
  )
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)