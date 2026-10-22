import { StrictMode, useState, useEffect } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import Home from "./Home.tsx"
import Login from "./Login.tsx"
import CreateAccount from "./CreateAccount.tsx"
import NotFound from "./NotFound.tsx"

const APP_ROOT = "/app"



export const App = () => {
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
    case `${APP_ROOT}/home`:
      page = <Home />
      break
    case `${APP_ROOT}/login`:
      page = <Login />
      break
    case `${APP_ROOT}/create-account`:
      page = <CreateAccount />
      break
    default:
      page = <NotFound />
  }

  return (
    <>
      <header>
        <a className="logo" href={`${APP_ROOT}/home`}>ShortWork Pro</a>
        <div className="flex-space" />
        <a className="log-in-button" href={`${APP_ROOT}/login`}>Log In</a>
        <a className="create-account-btn" href={`${APP_ROOT}/create-account`}>Create Account</a>
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