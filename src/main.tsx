import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Home from './Home.tsx'
import Login from './Login.tsx'
import CreateAccount from './CreateAccount.tsx'
import NotFound from './NotFound.tsx'

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
            document.activeElement.blur() // fix bug where password autocomplete would persist after navigation
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


  let page;
  switch (path) {
    case "/":
      page = <Home />
      break
    case "/login":
      page = <Login />
      break
    case "/create-account":
      page = <CreateAccount />
      break
    default:
      page = <NotFound />
  }

  return (
    <>
      <header>
        <a className="logo" href="/">ShortWork Pro</a>
        <div className="flex-space" />
        <a className="log-in-button" href="/login">Log In</a>
        <a className="create-account-btn" href="/create-account">Create Account</a>
      </header>
      {page}
    </>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)