// Main body -- everything below the header.
// Controls routing and navigation.

import { useState, useEffect } from "react"

import Home from "./Home"
import Login from "./Login"
import CreateAccount from "./CreateAccount"
import MyUrls from "./MyUrls"

const ErrorPage = ({ children }: { children: string | null }) => (
  <main>
    <h1>Error</h1>
    <p>{children || "Unknown error"}</p>
    <a className="link-underline" href="/app/home">Back to Home</a>
  </main>
)

type Props = {
  onLogin?: () => void,
  loggedIn: boolean
}

export default function Page({ onLogin, loggedIn }: Props) {
  const [path, setPath] = useState(window.location.pathname)

  // Handle link clicks and browser navigation buttons
  useEffect(() => {
    const handleNavigation = (event: NavigateEvent) => {
      const url = new URL(event.destination.url)
      if (!event.canIntercept || event.hashChange || event.downloadRequest || url.origin !== window.location.origin) return

      event.intercept({
        handler() {
          if (document.activeElement instanceof HTMLElement) document.activeElement.blur() // fix bug in Safari where password autocomplete ui would persist after navigation
          setPath(url.pathname) // Update React state
          // The browser updates the address bar automatically
        }
      })

    }

    navigation.addEventListener("navigate", handleNavigation)
    return () => navigation.removeEventListener("navigate", handleNavigation)
  }, [])

  switch (path) {
    case "/app/home":
      return <Home />
    case "/app/login":
      if (loggedIn) return <ErrorPage>Log out to access this page</ErrorPage>
      return <Login onLogin={onLogin} />
    case "/app/create-account":
      if (loggedIn) return <ErrorPage>Log out to access this page</ErrorPage>
      return <CreateAccount onLogin={onLogin} />
    case "/app/my-urls":
      if (!loggedIn) return <ErrorPage>Log in to access this page</ErrorPage>
      return <MyUrls />
    case "/app/error":
      const params = new URLSearchParams(window.location.search)
      return <ErrorPage>{params.get("e")}</ErrorPage>
    default:
      return (
        <main>
          <h1>Page Not Found</h1>
          <p>This URL doesn't exist on our servers.</p>
          <a className="link-underline" href="/app/home">Back to Home</a>
        </main>
      )
  }
}