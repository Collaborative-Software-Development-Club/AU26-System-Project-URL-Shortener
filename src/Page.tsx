// Main body -- everything below the header.

import { useState, useEffect } from "react"

import Home from "./Home"
import Login from "./Login"
import CreateAccount from "./CreateAccount"
import NotFound from "./NotFound"

type Props = {
  onLogin?: () => void,
  addError: (e: string) => void,
  loggedIn: boolean
}

export default ({ onLogin, addError, loggedIn }: Props) => {
  const [path, setPath] = useState(window.location.pathname)

  // Handle link clicks and browser navigation buttons
  useEffect(() => {
    const handleNavigation = (event: NavigateEvent) => {
      // TODO only intercept /app requests 
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
      return <Home addError={addError} />
    case "/app/login":
      if (loggedIn) window.location.href = "/app/home"
      return <Login onLogin={onLogin} addError={addError} />
    case "/app/create-account":
      if (loggedIn) window.location.href = "/app/home"
      return <CreateAccount onLogin={onLogin} addError={addError}/>
    default:
      return <NotFound />
  }
}